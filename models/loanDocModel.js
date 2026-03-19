const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // adjust path to your sequelize instance
const { Loan } = require("./loanModel"); // make sure this exists

const LoanDoc = sequelize.define(
  "LoanDoc",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    loan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Loan,
        key: "id",
      },
    },
    doc_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "loan_docs",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["loan_id", "doc_name"], // unique constraint
      },
    ],
  },
);

module.exports = { LoanDoc };
