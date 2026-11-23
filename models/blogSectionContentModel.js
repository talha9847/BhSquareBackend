const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { BlogSection } = require("./blogSectionModel");

const BlogSectionContent = sequelize.define(
  "BlogSectionContent",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    section_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: BlogSection,
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
    tableName: "blog_section_contents",
    timestamps: false,
  },
);

module.exports = { BlogSectionContent };
