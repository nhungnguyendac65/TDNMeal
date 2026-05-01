const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const StudentAllergy = sequelize.define('StudentAllergy', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        StudentID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        CategoryID: {
            type: DataTypes.INTEGER, 
            allowNull: true,         
            references: {
                model: 'AllergyCategories',
                key: 'CategoryID' 
            }
        },
        SpecificNote: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        timestamps: false, 
    });

    return StudentAllergy;
};