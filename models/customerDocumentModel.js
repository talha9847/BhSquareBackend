const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CustomerDocument = sequelize.define(
  "CustomerDocument",
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
    consumer_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    geo_coordinate: {
      type: DataTypes.STRING(100),
    },
    registration_number: {
      type: DataTypes.STRING(50),
    },
    sub_division: {
      type: DataTypes.STRING(50),
    },
    final_system_size: {
      type: DataTypes.STRING(50),
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
    tableName: "customer_documents",
    timestamps: false,
  },
);

module.exports = { CustomerDocument };
