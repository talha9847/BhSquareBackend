const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const WebLead = sequelize.define(
  "WebLead",
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

    mobile: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },

    address: {
      type: DataTypes.TEXT,
    },

    status: {
      type: DataTypes.STRING(20),
      defaultValue: "pending",
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "web_leads",
    timestamps: false,
  },
);

module.exports = { WebLead };
