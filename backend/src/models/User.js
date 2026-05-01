const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
    UserID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true 
    },
    FullName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ClassRoom: {
        type: DataTypes.STRING,
        allowNull: true
    },
    Phone: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    PasswordHash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Role: {
        type: DataTypes.ENUM('Parent', 'Kitchen', 'Admin', 'Teacher'),
        allowNull: false
    },
    Status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active'
    }
}, {
    tableName: 'Users',
    timestamps: true
});

module.exports = User;