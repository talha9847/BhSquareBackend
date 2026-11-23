const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { BlogPost } = require("./blogPostModel");
const { BlogTag } = require("./blogTagModel");

const BlogPostTag = sequelize.define(
  "BlogPostTag",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    blog_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: BlogPost,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    tag_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: BlogTag,
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "blog_post_tags",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["blog_id", "tag_id"],
      },
    ],
  },
);

module.exports = { BlogPostTag };
