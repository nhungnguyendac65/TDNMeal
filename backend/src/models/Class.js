// Đường dẫn: backend/src/models/Class.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Class = sequelize.define('Class', {
    ClassID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ClassName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    Status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active'
    }
}, {
    tableName: 'Classes',
    timestamps: false
});

module.exports = Class;