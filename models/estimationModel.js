const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { EstimationType } = require("./estimationTypeModel");

const Estimation = sequelize.define(
  "Estimation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: EstimationType,
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },

    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    qty: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
  },
  {
    tableName: "estimation",
    timestamps: false,
  },
);

module.exports = { Estimation };
