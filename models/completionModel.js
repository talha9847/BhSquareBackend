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
      unique: true, // remove if multiple records per customer allowed
      references: {
        model: Customer,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "leads",
        key: "id",
      },
    },

    days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
      },
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
