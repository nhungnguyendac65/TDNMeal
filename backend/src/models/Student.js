// Path: backend/src/models/Student.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Student = sequelize.define('Student', {
    StudentID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    FullName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Gender: {
        type: DataTypes.ENUM('Male', 'Female'),
        allowNull: false
    },
    ClassRoom: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Unassigned' // Fallback for missing old data
    },
    Height: {
        type: DataTypes.FLOAT, // Height (cm)
        allowNull: true
    },
    Weight: {
        type: DataTypes.FLOAT, // Weight (kg)
        allowNull: true
    },
    HealthProfileCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false // For First Login Flow check
    },
    MealStatus: {
        type: DataTypes.STRING,
        defaultValue: 'Registered'
    },
}, {
    tableName: 'Students',
    timestamps: true
});

module.exports = Student;
