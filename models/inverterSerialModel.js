const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const InverterSerial = sequelize.define(
  "InverterSerial",
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
    tableName: "inverter_serials",
    timestamps: false,
  },
);

module.exports = { InverterSerial };
