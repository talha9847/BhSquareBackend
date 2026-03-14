const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // your Sequelize instance

const LeadDelay = sequelize.define(
  "LeadDelay",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "leads", // table name
        key: "id",
      },
      onDelete: "CASCADE",
    },

    next_visit_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "lead_delays",
    timestamps: false,
  },
);

module.exports = { LeadDelay };
