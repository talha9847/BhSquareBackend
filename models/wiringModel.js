const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { Customer } = require("./customerModel");

const Wiring = sequelize.define(
  "Wiring",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    customer_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Customer,
        key: "id",
      },
      onDelete: "CASCADE",
    },

    status: {
      type: DataTypes.STRING(20),
      defaultValue: "pending",
    },
    inventory_status: {
      type: DataTypes.STRING(20),
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
    tableName: "wiring",
    timestamps: false,
  },
);

// ----------------------
// Associations
Wiring.belongsTo(Customer, { foreignKey: "customer_id", as: "customer" });
Customer.hasMany(Wiring, { foreignKey: "customer_id", as: "wirings" });

module.exports = { Wiring };
