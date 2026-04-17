const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const KitReady = sequelize.define(
  "KitReady",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "customers",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    loan_status: {
      type: DataTypes.STRING(20),
      defaultValue: "pending",

      validate: {
        isIn: [["pending", "required", "completed", "not_applicable"]],
      },
    },

    status: {
      type: DataTypes.STRING(10),
      defaultValue: "pending",
      validate: {
        isIn: [["pending", "done", "delay"]],
      },
    },
    file_gen: {
      type: DataTypes.STRING(20),
      defaultValue: "pending",
      validate: {
        isIn: [["pending", "done"]],
      },
    },
  },
  {
    tableName: "kit_ready",
    timestamps: false,
  },
);

module.exports = { KitReady };
