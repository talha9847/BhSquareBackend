const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Commission = sequelize.define(
  "Commission",
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

    source_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    total_kw: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    commission: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
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
    tableName: "commission",
    timestamps: false,
  },
);

module.exports = { Commission };
