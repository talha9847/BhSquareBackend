const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Stage = sequelize.define(
  "Stage",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    stage_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    default_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "stages",
    timestamps: false,
  },
);

module.exports = { Stage };
