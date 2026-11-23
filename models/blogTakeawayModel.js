const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { BlogPost } = require("./blogPostModel");

const BlogTakeaway = sequelize.define(
  "BlogTakeaway",
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "blog_takeaways",
    timestamps: false,
  },
);

module.exports = { BlogTakeaway };
