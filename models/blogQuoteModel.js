const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { BlogPost } = require("./blogPostModel");

const BlogQuote = sequelize.define(
  "BlogQuote",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    blog_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      references: {
        model: BlogPost,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    quote_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    quote_author: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "blog_quotes",
    timestamps: false,
  },
);

module.exports = { BlogQuote };
