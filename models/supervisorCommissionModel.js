const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SupervisorCommission = sequelize.define(
  "SupervisorCommission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    supervisor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    total_kw: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    type: {
      type: DataTypes.STRING(20), // commercial / residential
      allowNull: false,
    },

    commission: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    status: {
      type: DataTypes.STRING(20),
      defaultValue: "pending", // pending / paid
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "supervisor_commission",
    timestamps: false,
  },
);

module.exports = { SupervisorCommission };
