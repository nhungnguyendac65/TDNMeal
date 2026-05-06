const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const DailyMealSelection = sequelize.define('DailyMealSelection', {
        SelectionID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        RegistrationID: { type: DataTypes.INTEGER, allowNull: false }, // Links to the monthly registrationID
        StudentID: { type: DataTypes.INTEGER, allowNull: false },
        Date: { type: DataTypes.DATEONLY, allowNull: false }, // Specific meal date (e.g., 2026-10-12)
        MealType: { 
            type: DataTypes.ENUM('Standard', 'Vegetarian', 'None'), 
            defaultValue: 'Standard' // Default to Standard if not chosen
        }
    }, {
        timestamps: true,
    });
    return DailyMealSelection;
};