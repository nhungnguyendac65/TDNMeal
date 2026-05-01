const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); // (Nhớ kiểm tra lại đường dẫn file database của bạn nha)

const Ingredient = sequelize.define('Ingredient', {
    IngredientID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    IngredientName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    CategoryID: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    StockQuantity: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    Unit: {
        type: DataTypes.STRING,
        allowNull: true
    },
    Supplier: {
        type: DataTypes.STRING,
        allowNull: true
    },
    MinStockLevel: {
        type: DataTypes.FLOAT,
        defaultValue: 5
    }
}, {
    tableName: 'Ingredients', 
    timestamps: true
});

module.exports = Ingredient;