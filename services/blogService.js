const {
  BlogPost,
  BlogCategory,
  BlogSection,
  BlogSectionContent,
  BlogTag,
  BlogPostTag,
  BlogTakeaway,
  BlogQuote,
} = require("../models/associationModel");
const { Op } = require("sequelize");

class BlogService {
  async getAllPosts({ status, categoryId, tagId, search, limit = 10, offset = 0 } = {}) {
    const where = {};
    if (status) where.status = status;
    if (categoryId) where.category_id = categoryId;

    const include = [
      {
        model: BlogCategory,
        as: "category",
      },
      {
        model: BlogTag,
        as: "tags",
        through: { attributes: [] },
        ...(tagId ? { where: { id: tagId } } : {}),
      },
      {
        model: BlogQuote,
        as: "quote",
        required: false,
      },
      {
        model: BlogTakeaway,
        as: "takeaways",
        required: false,
      },
    ];

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { excerpt: { [Op.iLike]: `%${search}%` } },
        { author_name: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await BlogPost.findAndCountAll({
      where,
      include,
      distinct: true,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    return {
      total: count,
      posts: rows,
      limit: parseInt(limit),
      offset: parseInt(offset),
    };
  }

  async getPostBySlugOrId(identifier) {
    const isId = /^\d+$/.test(identifier);
    const where = isId ? { id: identifier } : { slug: identifier };

    const post = await BlogPost.findOne({
      where,
      include: [
        {
          model: BlogCategory,
          as: "category",
        },
        {
          model: BlogTag,
          as: "tags",
          through: { attributes: [] },
        },
        {
          model: BlogSection,
          as: "sections",
          include: [
            {
              model: BlogSectionContent,
              as: "contents",
              order: [["sort_order", "ASC"]],
            },
          ],
          order: [["sort_order", "ASC"]],
        },
        {
          model: BlogTakeaway,
          as: "takeaways",
          order: [["sort_order", "ASC"]],
        },
        {
          model: BlogQuote,
          as: "quote",
        },
      ],
    });

    return post;
  }

  async getAllCategories() {
    return await BlogCategory.findAll({
      order: [["name", "ASC"]],
    });
  }

  async getAllTags() {
    return await BlogTag.findAll({
      order: [["name", "ASC"]],
    });
  }

  async createPost(data) {
    const {
      title,
      slug,
      category_id,
      category_name, // optional: create or find category
      author_name,
      author_role,
      author_initials,
      excerpt,
      intro,
      featured_image,
      image_alt,
      read_time,
      is_featured,
      is_recommended,
      status,
      published_at,
      takeaways = [], // array of strings
      sections = [], // array of { heading, sort_order, paragraphs: [], bullets: [] }
      quote = null, // { quote_text, quote_author }
      tags = [], // array of strings (tag names)
    } = data;

    let finalCategoryId = category_id;
    if (!finalCategoryId && category_name) {
      const slugify = (str) =>
        str
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
      const [cat] = await BlogCategory.findOrCreate({
        where: { slug: slugify(category_name) },
        defaults: { name: category_name, slug: slugify(category_name) },
      });
      finalCategoryId = cat.id;
    }

    const post = await BlogPost.create({
      title,
      slug,
      category_id: finalCategoryId,
      author_name,
      author_role,
      author_initials,
      excerpt,
      intro,
      featured_image,
      image_alt,
      read_time,
      is_featured,
      is_recommended,
      status: status || "draft",
      published_at: published_at || (status === "published" ? new Date() : null),
    });

    // Handle Takeaways
    if (takeaways && takeaways.length > 0) {
      const takeawayRecords = takeaways.map((t, idx) => ({
        blog_id: post.id,
        content: typeof t === "string" ? t : t.content,
        sort_order: idx,
      }));
      await BlogTakeaway.bulkCreate(takeawayRecords);
    }

    // Handle Sections & Contents
    if (sections && sections.length > 0) {
      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const secData = sections[sIdx];
        const section = await BlogSection.create({
          blog_id: post.id,
          heading: secData.heading,
          sort_order: secData.sort_order !== undefined ? secData.sort_order : sIdx,
        });

        const contents = [];
        if (secData.paragraphs && Array.isArray(secData.paragraphs)) {
          secData.paragraphs.forEach((p, pIdx) => {
            contents.push({
              section_id: section.id,
              content: p,
              sort_order: pIdx,
            });
          });
        }
        if (secData.bullets && Array.isArray(secData.bullets)) {
          secData.bullets.forEach((b, bIdx) => {
            contents.push({
              section_id: section.id,
              content: `• ${b}`,
              sort_order: (secData.paragraphs ? secData.paragraphs.length : 0) + bIdx,
            });
          });
        }
        if (secData.contents && Array.isArray(secData.contents)) {
          secData.contents.forEach((c, cIdx) => {
            contents.push({
              section_id: section.id,
              content: typeof c === "string" ? c : c.content,
              sort_order: c.sort_order !== undefined ? c.sort_order : cIdx,
            });
          });
        }

        if (contents.length > 0) {
          await BlogSectionContent.bulkCreate(contents);
        }
      }
    }

    // Handle Quote
    if (quote && quote.quote_text) {
      await BlogQuote.create({
        blog_id: post.id,
        quote_text: quote.quote_text || quote.text,
        quote_author: quote.quote_author || quote.by,
      });
    }

    // Handle Tags
    if (tags && tags.length > 0) {
      const slugify = (str) =>
        str
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
      for (const tagName of tags) {
        const tagSlug = slugify(tagName);
        const [tag] = await BlogTag.findOrCreate({
          where: { slug: tagSlug },
          defaults: { name: tagName, slug: tagSlug },
        });
        await BlogPostTag.findOrCreate({
          where: { blog_id: post.id, tag_id: tag.id },
        });
      }
    }

    return await this.getPostBySlugOrId(post.id);
  }

  async updatePost(id, data) {
    const post = await BlogPost.findByPk(id);
    if (!post) throw new Error("Blog post not found");

    const {
      title,
      slug,
      category_id,
      category_name,
      author_name,
      author_role,
      author_initials,
      excerpt,
      intro,
      featured_image,
      image_alt,
      read_time,
      is_featured,
      is_recommended,
      status,
      published_at,
      takeaways,
      sections,
      quote,
      tags,
    } = data;

    let finalCategoryId = category_id;
    if (!finalCategoryId && category_name) {
      const slugify = (str) =>
        str
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
      const [cat] = await BlogCategory.findOrCreate({
        where: { slug: slugify(category_name) },
        defaults: { name: category_name, slug: slugify(category_name) },
      });
      finalCategoryId = cat.id;
    }

    await post.update({
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(finalCategoryId !== undefined && { category_id: finalCategoryId }),
      ...(author_name !== undefined && { author_name }),
      ...(author_role !== undefined && { author_role }),
      ...(author_initials !== undefined && { author_initials }),
      ...(excerpt !== undefined && { excerpt }),
      ...(intro !== undefined && { intro }),
      ...(featured_image !== undefined && { featured_image }),
      ...(image_alt !== undefined && { image_alt }),
      ...(read_time !== undefined && { read_time }),
      ...(is_featured !== undefined && { is_featured }),
      ...(is_recommended !== undefined && { is_recommended }),
      ...(status !== undefined && {
        status,
        published_at:
          status === "published" && !post.published_at ? new Date() : published_at,
      }),
    });

    if (takeaways !== undefined) {
      await BlogTakeaway.destroy({ where: { blog_id: post.id } });
      if (takeaways.length > 0) {
        const takeawayRecords = takeaways.map((t, idx) => ({
          blog_id: post.id,
          content: typeof t === "string" ? t : t.content,
          sort_order: idx,
        }));
        await BlogTakeaway.bulkCreate(takeawayRecords);
      }
    }

    if (sections !== undefined) {
      await BlogSection.destroy({ where: { blog_id: post.id } });
      if (sections.length > 0) {
        for (let sIdx = 0; sIdx < sections.length; sIdx++) {
          const secData = sections[sIdx];
          const section = await BlogSection.create({
            blog_id: post.id,
            heading: secData.heading,
            sort_order: secData.sort_order !== undefined ? secData.sort_order : sIdx,
          });

          const contents = [];
          if (secData.paragraphs && Array.isArray(secData.paragraphs)) {
            secData.paragraphs.forEach((p, pIdx) => {
              contents.push({
                section_id: section.id,
                content: p,
                sort_order: pIdx,
              });
            });
          }
          if (secData.bullets && Array.isArray(secData.bullets)) {
            secData.bullets.forEach((b, bIdx) => {
              contents.push({
                section_id: section.id,
                content: `• ${b}`,
                sort_order: (secData.paragraphs ? secData.paragraphs.length : 0) + bIdx,
              });
            });
          }
          if (secData.contents && Array.isArray(secData.contents)) {
            secData.contents.forEach((c, cIdx) => {
              contents.push({
                section_id: section.id,
                content: typeof c === "string" ? c : c.content,
                sort_order: c.sort_order !== undefined ? c.sort_order : cIdx,
              });
            });
          }

          if (contents.length > 0) {
            await BlogSectionContent.bulkCreate(contents);
          }
        }
      }
    }

    if (quote !== undefined) {
      await BlogQuote.destroy({ where: { blog_id: post.id } });
      if (quote && (quote.quote_text || quote.text)) {
        await BlogQuote.create({
          blog_id: post.id,
          quote_text: quote.quote_text || quote.text,
          quote_author: quote.quote_author || quote.by,
        });
      }
    }

    if (tags !== undefined) {
      await BlogPostTag.destroy({ where: { blog_id: post.id } });
      if (tags.length > 0) {
        const slugify = (str) =>
          str
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
        for (const tagName of tags) {
          const tagSlug = slugify(tagName);
          const [tag] = await BlogTag.findOrCreate({
            where: { slug: tagSlug },
            defaults: { name: tagName, slug: tagSlug },
          });
          await BlogPostTag.findOrCreate({
            where: { blog_id: post.id, tag_id: tag.id },
          });
        }
      }
    }

    return await this.getPostBySlugOrId(post.id);
  }

  async deletePost(id) {
    const post = await BlogPost.findByPk(id);
    if (!post) throw new Error("Blog post not found");
    await post.destroy();
    return { success: true, message: "Blog post deleted successfully" };
  }
}

module.exports = new BlogService();
