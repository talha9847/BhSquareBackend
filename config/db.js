const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("postgres", "postgres", process.env.DB_PASS, {
  host: process.env.HOST,
  dialect: "postgres",
});

module.exports = sequelize;
