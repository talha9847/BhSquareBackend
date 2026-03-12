const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  logging: false,
});

sequelize.authenticate()
  .then(() => console.log('✅ Connected to Neon!'))
  .catch(err => console.error('❌ DB connection failed:', err));

module.exports = sequelize;