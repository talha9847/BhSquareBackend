const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { BlogCategory } = require("./blogCategoryModel");

const BlogPost = sequelize.define(
  "BlogPost",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    category_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: BlogCategory,
        key: "id",
      },
      onDelete: "SET NULL",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    author_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    author_role: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    author_initials: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    intro: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    featured_image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image_alt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    read_time: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_recommended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: "draft",
      validate: {
        isIn: [["draft", "published", "archived"]],
      },
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "blog_posts",
    timestamps: false,
  },
);

module.exports = { BlogPost };
