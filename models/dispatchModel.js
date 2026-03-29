const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Dispatch = sequelize.define(
  "Dispatch",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // ✅ NEW FIELDS
    driver_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    car_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    driver_name: {
      type: DataTypes.STRING(255),
    },
    vehicle: {
      type: DataTypes.STRING(100),
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: "pending",
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
    tableName: "dispatch",
    timestamps: false,
  },
);

module.exports = { Dispatch };
