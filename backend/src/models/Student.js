// Đường dẫn: backend/src/models/Student.js
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
        defaultValue: 'Chưa xếp lớp' // Đề phòng các data cũ bị rỗng
    },
    Height: {
        type: DataTypes.FLOAT, // Chiều cao (cm)
        allowNull: true
    },
    Weight: {
        type: DataTypes.FLOAT, // Cân nặng (kg)
        allowNull: true
    },
    HealthProfileCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false // Dùng để check First Login Flow
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
