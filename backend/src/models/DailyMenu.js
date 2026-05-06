// Path: backend/src/models/DailyMenu.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DailyMenu = sequelize.define('DailyMenu', {
    MenuID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    MenuDate: {
        type: DataTypes.DATEONLY, // Stores date only (YYYY-MM-DD)
        allowNull: false,
        unique: true 
    },
    TotalCalories: {
        type: DataTypes.FLOAT, // Calories for standard meal
        defaultValue: 0
    },
    VegCalories: { // Calories for vegetarian meal
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    Status: {
        type: DataTypes.ENUM('Draft', 'Submitted', 'Approved', 'Rejected'),
        defaultValue: 'Draft'
    },
    // List of standard dish IDs (e.g., "1,5,8,12")
    StandardDishList: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // List of vegetarian dish IDs (e.g., "2,6,9,15")
    VegetarianDishList: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Rejection reason from Admin if rejected
    RejectReason: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'DailyMenus',
    timestamps: true
});

module.exports = DailyMenu;