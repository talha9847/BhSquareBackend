const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const WiringDocs = sequelize.define(
  "WiringDocs",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    wiring_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    doc_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    doc_link: {
      type: DataTypes.TEXT,
      allowNull: false,
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
    tableName: "wiring_docs",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["wiring_id", "doc_name"], // ✅ matches DB constraint
      },
    ],
  },
);

module.exports = { WiringDocs };
