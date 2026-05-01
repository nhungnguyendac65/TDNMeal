// Đường dẫn: backend/src/models/Dish.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Dish = sequelize.define('Dish', {
    DishID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    DishName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    DishNameEn: {
        type: DataTypes.STRING,
        allowNull: true
    },
    Type: {
        type: DataTypes.STRING,
        allowNull: true // Mặn, Chay, Rau, Canh, Phụ
    },
    DishType: {
        type: DataTypes.STRING,
        allowNull: true // Dành cho các tính năng cũ của Admin/Phụ huynh nếu có
    },
    Calories: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    MainIngredients: {
        type: DataTypes.TEXT, // Dùng TEXT để chứa được văn bản rất dài và xuống dòng thoải mái
        allowNull: true
    },
    SupplierName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    Allergies: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ImageUrl: {
        type: DataTypes.STRING, // Chứa đường dẫn ảnh
        allowNull: true
    },
    Description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'Dishes',
    timestamps: true
});

module.exports = Dish;