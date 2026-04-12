const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { Customer } = require("./customerModel");

const Completion = sequelize.define(
  "Completion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: Customer,
        key: "id",
      },
      onDelete: "CASCADE",
    },

    kit_cost: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    wire_cost: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    extra_cost: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    total_cost: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    remarks: {
      type: DataTypes.TEXT,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "completion",
    timestamps: false,
  },
);

module.exports = { Completion };
