const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const UnusedInventory = sequelize.define(
  "UnusedInventory",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "customers",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    kit_item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "kit_items",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    inventory_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "inventory_table",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    unused_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    tableName: "unused_inventory",
    timestamps: false,
  },
);

module.exports = { UnusedInventory };
