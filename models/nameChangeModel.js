const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const NameChange = sequelize.define(
  "NameChange",
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
        model: "customer", // table name
        key: "id",
      },
      onDelete: "CASCADE",
    },
    document_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    document_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "name_change",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["customer_id", "document_name"],
      },
    ],
  },
);

module.exports = { NameChange };
