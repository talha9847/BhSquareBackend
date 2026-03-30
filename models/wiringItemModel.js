const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const WiringItem = sequelize.define(
  "WiringItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    wiring_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    wire_inventory_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
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
    tableName: "wiring_items",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["wiring_id", "wire_inventory_id"],
      },
    ],
  },
);

module.exports = { WiringItem };
