const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // adjust path to your sequelize instance
const { Customer } = require("./customerModel"); // make sure this exists

const Loan = sequelize.define(
  "Loan",
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
        model: Customer,
        key: "id",
      },
    },
    bank_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    is_applied: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    estimated: {
      type: DataTypes.DECIMAL(12, 2),
    },
    loan_amount: {
      type: DataTypes.DECIMAL(12, 2),
    },
    interest_rate: {
      type: DataTypes.DECIMAL(5, 2),
    },
    bank_remarks: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.STRING,
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "customer_loan",
    timestamps: false, // since we have created_at manually
  },
);

module.exports = { Loan };
