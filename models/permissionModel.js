const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Permission = sequelize.define(
  "Permission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    source_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "lead_sources", // Matches the tableName of your Source model
        key: "id",
      },
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "customers",
        key: "id",
      },
    },
    page_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "pages",
        key: "id",
      },
    },
    is_permitted: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "permission",
    timestamps: false,
  },
);

module.exports = { Permission };
