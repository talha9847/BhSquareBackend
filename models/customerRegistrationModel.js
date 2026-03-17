const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { PanelSerial } = require("./panelSerialModel");

const CustomerRegistration = sequelize.define(
  "CustomerRegistration",
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
    },
    application_number: {
      type: DataTypes.STRING(50),
    },
    registration_date: {
      type: DataTypes.DATEONLY,
    },
    agreement_date: {
      type: DataTypes.DATEONLY,
    },
    inverter_qty: {
      type: DataTypes.INTEGER,
    },
    panel_qty: {
      type: DataTypes.INTEGER,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: "pending", // overall workflow status
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "customer_registration",
    timestamps: false,
  },
);

module.exports = { CustomerRegistration };
