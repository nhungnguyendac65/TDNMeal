const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const DailyMealSelection = sequelize.define('DailyMealSelection', {
        SelectionID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        RegistrationID: { type: DataTypes.INTEGER, allowNull: false }, // Thuộc về phiếu đăng ký tháng nào
        StudentID: { type: DataTypes.INTEGER, allowNull: false },
        Date: { type: DataTypes.DATEONLY, allowNull: false }, // Ngày ăn cụ thể (VD: 2026-10-12)
        MealType: { 
            type: DataTypes.ENUM('Standard', 'Vegetarian'), 
            defaultValue: 'Standard' // Mặc định là suất Mặn nếu không chọn
        }
    }, {
        timestamps: true,
    });
    return DailyMealSelection;
};