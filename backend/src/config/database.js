// Đường dẫn: backend/src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Khởi tạo kết nối Sequelize
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

// Hàm kiểm tra kết nối
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Kết nối đến PostgreSQL (trandainghia_meal_system) thành công!');
    } catch (error) {
        console.error('Không thể kết nối đến database:', error);
    }
};

module.exports = { sequelize, connectDB };