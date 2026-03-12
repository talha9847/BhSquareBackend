const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("postgres", "postgres", "GUuqA5evfKFZK12I", {
  host: "db.yxrtvstnzpcqwlkzmxkt.supabase.co",
  dialect: "postgres",
});

module.exports = sequelize;
