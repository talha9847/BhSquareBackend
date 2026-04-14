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
    commission_rate: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
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
