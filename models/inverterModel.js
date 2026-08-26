const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Inverter = sequelize.define(
  "Inverter",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    kw: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
  },
  {
    tableName: "inverter",
    timestamps: false,
  },
);

module.exports = { Inverter };
