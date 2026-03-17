const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { CustomerRegistration } = require("./customerRegistrationModel");

const FileGeneration = sequelize.define(
  "FileGeneration",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    registration_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: CustomerRegistration,
        key: "id",
      },
      onDelete: "CASCADE",
    },

    cs_no: {
      type: DataTypes.STRING(50),
    },

    beneficiary_name: {
      type: DataTypes.STRING(255),
    },
    beneficiary_address: {
      type: DataTypes.TEXT,
    },
    consumer_contact: {
      type: DataTypes.STRING(50),
    },

    application_number: {
      type: DataTypes.STRING(50),
    },
    consumer_number: {
      type: DataTypes.STRING(50),
    },

    registration_date: {
      type: DataTypes.DATEONLY,
    },
    agreement_date: {
      type: DataTypes.DATEONLY,
    },

    geo_location: {
      type: DataTypes.STRING(255),
    },
    subdivision: {
      type: DataTypes.STRING(255),
    },

    panel_brand: {
      type: DataTypes.STRING(100),
    },
    panel_capacity: {
      type: DataTypes.DECIMAL(10, 2),
    },
    panel_quantity: {
      type: DataTypes.INTEGER,
    },

    system_capacity: {
      type: DataTypes.DECIMAL(10, 2),
    },

    inverter_brand: {
      type: DataTypes.STRING(100),
    },
    inverter_capacity: {
      type: DataTypes.DECIMAL(10, 2),
    },

    generated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    file_path: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "file_generation",
    timestamps: false,
  }
);



module.exports = { FileGeneration };