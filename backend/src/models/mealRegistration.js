const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MealRegistration = sequelize.define('MealRegistration', {
        RegistrationID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        StudentID: { type: DataTypes.INTEGER, allowNull: false },
        Month: { type: DataTypes.STRING(7), allowNull: false, comment: 'Format: YYYY-MM' },
        TotalDays: { type: DataTypes.INTEGER, allowNull: false },
        TotalPrice: { type: DataTypes.INTEGER, allowNull: false },
        PaymentMethod: { 
            type: DataTypes.STRING, 
            allowNull: false,
            defaultValue: 'Cash',
            validate: {
                isIn: [['Transfer', 'Cash']]
            }
        },
        Status: {
            type: DataTypes.ENUM('Pending Payment', 'Paid', 'Cancelled'),
            defaultValue: 'Pending Payment'
        },
        PayOSOrderCode: { type: DataTypes.BIGINT, allowNull: true },
        PayOSCheckoutUrl: { type: DataTypes.TEXT, allowNull: true }
    }, {
        timestamps: true,
    });
    return MealRegistration;
};