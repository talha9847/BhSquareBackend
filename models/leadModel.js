const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Lead = sequelize.define(
  "Lead",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    customer_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    contact_number: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },

    site_visit_date: {
      type: DataTypes.DATEONLY,
    },

    source_id: {
      type: DataTypes.INTEGER,
    },

    address: {
      type: DataTypes.TEXT,
    },

    notes: {
      type: DataTypes.TEXT,
    },

    panel_wattage: {
      type: DataTypes.DECIMAL(10, 2),
    },

    number_of_panels: {
      type: DataTypes.INTEGER,
    },

    total_capacity: {
      type: DataTypes.DECIMAL(10, 2),
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    installation_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "leads",
    timestamps: false,
  },
);

module.exports = { Lead };
