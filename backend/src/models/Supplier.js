// Path: backend/src/models/Supplier.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Supplier = sequelize.define('Supplier', {
    SupplierID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    SupplierName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    LogoUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    CertStatus: {
        type: DataTypes.STRING, // Example: 'VietGAP', 'ISO 22000'
        allowNull: true
    },
    CertExpDate: {
        type: DataTypes.DATEONLY, // Certificate expiration date
        allowNull: true
    },
    Status: {
        type: DataTypes.ENUM('Active', 'Suspended'),
        defaultValue: 'Active'
    }
}, {
    tableName: 'Suppliers',
    timestamps: true
});

module.exports = Supplier;