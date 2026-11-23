const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const BlogTag = sequelize.define(
  "BlogTag",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    slug: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "blog_tags",
    timestamps: false,
  },
);

module.exports = { BlogTag };
