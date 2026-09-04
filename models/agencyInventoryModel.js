const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { Agency } = require("./agencyModel");
const { Inventory } = require("./inventoryModel");

const AgencyInventory = sequelize.define(
  "AgencyInventory",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    agency_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Agency,
        key: "id",
      },
      onDelete: "CASCADE",
    },

    inventory_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Inventory,
        key: "id",
      },
      onDelete: "CASCADE",
    },

    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "agency_inventory",
    timestamps: false,
  },
);

module.exports = { AgencyInventory };
