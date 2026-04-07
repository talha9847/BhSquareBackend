const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Page = sequelize.define(
  "Page",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true, // Based on your SQL: name VARCHAR(100)
    },
    url: {
      type: DataTypes.STRING(50),
    },
  },
  {
    tableName: "pages",
    timestamps: false,
  },
);

module.exports = { Page };
