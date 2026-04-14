const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Supervisor = sequelize.define(
  "Supervisor",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    commercial_commission: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    residential_commission: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "supervisor",
    timestamps: false,
  },
);

module.exports = { Supervisor };
