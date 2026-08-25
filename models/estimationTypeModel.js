const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const EstimationType = sequelize.define(
  "EstimationType",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    tableName: "estimation_type",
    timestamps: false,
  },
);

module.exports = { EstimationType };
