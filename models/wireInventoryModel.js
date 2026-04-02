// models/wireInventoryModel.js

const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Adjust path to your DB config

const WireInventory = sequelize.define(
  "WireInventory",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    brand_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    wire_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    gauge: {
      type: DataTypes.FLOAT, // cross-sectional area in mm²
      allowNull: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2), // better than INTEGER
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0, // prevents negative price
      },
    },
    tax: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
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
    tableName: "wire_inventory",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["brand_name", "wire_type", "color", "gauge"],
      },
    ],
  },
);

module.exports = { WireInventory };
