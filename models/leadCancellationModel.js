const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const LeadCancellation = sequelize.define(
  "LeadCancellation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "leads",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    reason: {
      type: DataTypes.TEXT,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "lead_cancellations",
    timestamps: false,
  },
);

module.exports = { LeadCancellation };
