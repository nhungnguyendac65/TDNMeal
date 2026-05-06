// Path: backend/src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize connection
const sequelize = process.env.DATABASE_URL 
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    })
    : new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            dialect: 'postgres',
            logging: false,
        }
    );

// Connection test function
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection to PostgreSQL (trandainghia_meal_system) established successfully!');
    } catch (error) {
        console.error('Unable to connect to database:', error);
    }
};

module.exports = { sequelize, connectDB };