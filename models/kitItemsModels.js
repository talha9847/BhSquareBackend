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
        model: "inventory_table", // make sure this model exists
        key: "id",
      },
      onDelete: "CASCADE",
    },

    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
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
        fields: ["kit_id", "inventory_id"], // prevent duplicates
      },
    ],
  },
);

module.exports = { KitItems };
