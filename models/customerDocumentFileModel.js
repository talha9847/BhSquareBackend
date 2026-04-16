const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { CustomerDocument } = require("./customerDocumentModel");

const CustomerDocumentFile = sequelize.define(
  "CustomerDocumentFile",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    document_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    is_got: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    file_url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "customer_document_files",
    timestamps: false,
  },
);

module.exports = { CustomerDocumentFile };
