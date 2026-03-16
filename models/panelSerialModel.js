const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PanelSerial = sequelize.define(
  "PanelSerial",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    registration_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    serial_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "panel_serials",
    timestamps: false,
  },
);

module.exports = { PanelSerial };
