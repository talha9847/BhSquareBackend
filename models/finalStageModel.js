const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { Customer } = require("./customerModel");

const FinalStage = sequelize.define(
  "FinalStage",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // 🔥 one record per customer
      references: {
        model: Customer,
        key: "id",
      },
      onDelete: "CASCADE",
    },

    file_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    file_uploaded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    inspection: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    redeem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    disbursal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "final_stage",
    timestamps: false,
  },
);

module.exports = { FinalStage };
