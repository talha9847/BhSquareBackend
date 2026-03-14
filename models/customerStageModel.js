const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CustomerStage = sequelize.define(
  "CustomerStage",
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
    stage_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "stages",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "not_used", // pending, done, not_used
    },
    note: {
      type: DataTypes.TEXT,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "customer_stages",
    timestamps: false,
  },
);

module.exports = { CustomerStage };
