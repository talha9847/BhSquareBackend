const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { Lead } = require("./leadModel");

const Customer = sequelize.define(
  "Customer",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "leads",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: "pending", // overall workflow status
    },
    name_change: {
      type: DataTypes.STRING(20),
      defaultValue: "not_used", // not_used, required, changed, unchanged
    },
  },
  {
    tableName: "customers",
    timestamps: false,
  },
);


module.exports = { Customer };
