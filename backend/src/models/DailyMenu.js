// Đường dẫn: backend/src/models/DailyMenu.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DailyMenu = sequelize.define('DailyMenu', {
    MenuID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    MenuDate: {
        type: DataTypes.DATEONLY, // Chỉ lưu ngày (YYYY-MM-DD)
        allowNull: false,
        unique: true 
    },
    TotalCalories: {
        type: DataTypes.FLOAT, // Calo suất mặn
        defaultValue: 0
    },
    VegCalories: { // [BỔ SUNG] Calo suất chay
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    Status: {
        type: DataTypes.ENUM('Draft', 'Submitted', 'Approved', 'Rejected'),
        defaultValue: 'Draft'
    },
    // [BỔ SUNG] Lưu danh sách ID món mặn (VD: "1,5,8,12")
    StandardDishList: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // [BỔ SUNG] Lưu danh sách ID món chay (VD: "2,6,9,15")
    VegetarianDishList: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // [BỔ SUNG] Lưu phản hồi từ Admin nếu bị từ chối
    RejectReason: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'DailyMenus',
    timestamps: true
});

module.exports = DailyMenu;