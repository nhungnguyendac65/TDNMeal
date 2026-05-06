// Path: backend/src/models/Dish.js
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
        allowNull: true // Standard, Veggie, Vegetable, Soup, Side
    },
    DishType: {
        type: DataTypes.STRING,
        allowNull: true // For legacy features if any
    },
    Calories: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    MainIngredients: {
        type: DataTypes.TEXT, // Use TEXT for long multi-line text
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
        type: DataTypes.STRING, // Image path
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