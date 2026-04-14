const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const FabricatorCommission = sequelize.define(
  "FabricatorCommission",
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

    fabricator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    total_kw: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    commission: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    status: {
      type: DataTypes.STRING(20),
      defaultValue: "pending", // pending / approved / paid
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "fabricator_commission",
    timestamps: false,
  },
);

module.exports = { FabricatorCommission };
