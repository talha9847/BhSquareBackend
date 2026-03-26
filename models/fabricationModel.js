const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Fabrication = sequelize.define(
  "Fabrication",
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
      allowNull: true,
    },

    unused_pipes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    status: {
      type: DataTypes.ENUM("pending", "done"),
      defaultValue: "pending",
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "fabrication",
    timestamps: false,
  },
);

module.exports = { Fabrication };
