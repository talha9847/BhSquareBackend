// models/driverModel.js

const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Driver = sequelize.define(
  "Driver",
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

    mobile: {
      type: DataTypes.STRING(15),
      allowNull: false,
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
    tableName: "drivers",
    timestamps: false,
  }
);

module.exports = { Driver };