const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Source = sequelize.define(
  "Source",
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
    tableName: "lead_sources",
    timestamps: false,
  },
);

module.exports = { Source };
