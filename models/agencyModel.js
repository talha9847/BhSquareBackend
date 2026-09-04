const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Agency = sequelize.define(
  "Agency",
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

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "agency",
    timestamps: false,
  },
);

module.exports = { Agency };
