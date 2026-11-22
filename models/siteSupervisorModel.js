const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SiteSupervisor = sequelize.define(
  "SiteSupervisor",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
  },
  {
    tableName: "site_supervisor",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

module.exports = { SiteSupervisor };
