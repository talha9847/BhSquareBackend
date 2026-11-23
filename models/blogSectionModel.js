const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { BlogPost } = require("./blogPostModel");

const BlogSection = sequelize.define(
  "BlogSection",
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
    heading: {
      type: DataTypes.STRING(255),
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
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "blog_sections",
    timestamps: false,
  },
);

module.exports = { BlogSection };
