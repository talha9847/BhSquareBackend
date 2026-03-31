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

    // Panel fields
    panel_wattage: {
      type: DataTypes.DECIMAL(10, 2),
    },
    number_of_panels: {
      type: DataTypes.INTEGER,
    },
    total_capacity: {
      type: DataTypes.DECIMAL(10, 2),
      get() {
        const wattage = this.getDataValue("panel_wattage") || 0;
        const panels = this.getDataValue("number_of_panels") || 0;
        return Number(wattage) * Number(panels);
      },
    },

    // Inverter fields
    inverter_kw: {
      type: DataTypes.DECIMAL(10, 2),
    },
    number_of_inverters: {
      type: DataTypes.INTEGER,
    },
    inverter_capacity: {
      type: DataTypes.DECIMAL(10, 2),
      get() {
        const kw = this.getDataValue("inverter_kw") || 0;
        const invCount = this.getDataValue("number_of_inverters") || 0;
        return Number(kw) * Number(invCount);
      },
    },

    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pending",
    },
    installation_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Residential",
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
