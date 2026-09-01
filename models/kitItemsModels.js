const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const KitItems = sequelize.define(
  "KitItems",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    kit_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "kit_ready",
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

    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },

    partial_dispatched_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        dispatchQtyNotGreaterThanQty(value) {
          if (value > this.qty) {
            throw new Error(
              "Partial dispatched quantity cannot be greater than quantity",
            );
          }
        },
      },
    },

    status: {
      type: DataTypes.STRING(20),
      defaultValue: "pending",
      validate: {
        isIn: [["pending", "allocated", "used"]],
      },
    },
  },
  {
    tableName: "kit_items",
    timestamps: false,

    indexes: [
      {
        unique: true,
        fields: ["kit_id", "inventory_id"],
      },
    ],

    validate: {
      dispatchedQtyNotGreaterThanQty() {
        if (this.partial_dispatched_qty > this.qty) {
          throw new Error(
            "Partial dispatched quantity cannot be greater than quantity",
          );
        }
      },
    },
  },
);

module.exports = { KitItems };
