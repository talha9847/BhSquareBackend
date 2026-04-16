const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Backup = sequelize.define(
  "Backup",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true, // or you can switch to fixed 1 (optional)
    },

    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    file_url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "backup",
    timestamps: false,
  },
);

module.exports = { Backup };
