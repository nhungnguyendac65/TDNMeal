// Đường dẫn: backend/src/models/AllergyCategory.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AllergyCategory = sequelize.define('AllergyCategory', {
    CategoryID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    CategoryName: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    tableName: 'AllergyCategories',
    timestamps: false
});

module.exports = AllergyCategory;