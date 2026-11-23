const blogService = require("../services/blogService");

async function getPosts(req, res) {
  try {
    const { status, categoryId, tagId, search, limit, offset } = req.query;
    const result = await blogService.getAllPosts({
      status,
      categoryId,
      tagId,
      search,
      limit,
      offset,
    });
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in getPosts:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function getPostByIdOrSlug(req, res) {
  try {
    const { identifier } = req.params;
    const post = await blogService.getPostBySlugOrId(identifier);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Error in getPostByIdOrSlug:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await blogService.getAllCategories();
    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error in getCategories:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function getTags(req, res) {
  try {
    const tags = await blogService.getAllTags();
    return res.status(200).json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error("Error in getTags:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function createPost(req, res) {
  try {
    const postData = req.body;
    if (!postData.title || !postData.slug || !postData.author_name) {
      return res.status(400).json({
        success: false,
        message: "title, slug, and author_name are required",
      });
    }

    const newPost = await blogService.createPost(postData);
    return res.status(201).json({
      success: true,
      message: "Blog post created successfully",
      data: newPost,
    });
  } catch (error) {
    console.error("Error in createPost:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function updatePost(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedPost = await blogService.updatePost(id, updateData);
    return res.status(200).json({
      success: true,
      message: "Blog post updated successfully",
      data: updatedPost,
    });
  } catch (error) {
    console.error("Error in updatePost:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

async function deletePost(req, res) {
  try {
    const { id } = req.params;
    const result = await blogService.deletePost(id);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in deletePost:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  getPosts,
  getPostByIdOrSlug,
  getCategories,
  getTags,
  createPost,
  updatePost,
  deletePost,
};
