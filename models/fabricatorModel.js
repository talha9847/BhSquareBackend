const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Fabricator = sequelize.define(
  "Fabricator",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "fabricator",
    timestamps: false,
  },
);

module.exports = { Fabricator };
