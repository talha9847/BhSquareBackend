const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { Brand } = require("./brandModel");
const { Category } = require("./categoryModel");

const Inventory = sequelize.define(
  "Inventory",
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

    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Brand,
        key: "id",
      },
      onDelete: "SET NULL",
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Category,
        key: "id",
      },
    },
    qty: {
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

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "inventory_table",
    timestamps: false,
  },
);

module.exports = { Inventory };
