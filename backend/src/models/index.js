const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ==========================================
// 1. IMPORT ALL MODELS
// ==========================================
// Legacy models (Class-based)
const User = require('./User');
const Student = require('./Student');
const AllergyCategory = require('./AllergyCategory');
const Supplier = require('./Supplier');
const Ingredient = require('./Ingredient');
const Dish = require('./Dish');
const DailyMenu = require('./DailyMenu');


// New models (Function-based with sequelize)
const StudentAllergy = require('./studentAllergy')(sequelize);
const MealRegistration = require('./mealRegistration')(sequelize);
const DailyMealSelection = require('./dailyMealSelection')(sequelize); 

// ==========================================
// 2. DEFINE RELATIONSHIPS
// ==========================================
// Fixed: Added aliases 'children' and 'parent' for controller access
// Parent - Student
User.hasMany(Student, { foreignKey: 'ParentID', as: 'children' });
Student.belongsTo(User, { foreignKey: 'ParentID', as: 'parent' });

// Student - Allergy
Student.hasMany(StudentAllergy, { foreignKey: 'StudentID' });
StudentAllergy.belongsTo(Student, { foreignKey: 'StudentID' });

// Allergy Category - Allergy Detail
AllergyCategory.hasMany(StudentAllergy, { foreignKey: 'CategoryID' });
StudentAllergy.belongsTo(AllergyCategory, { foreignKey: 'CategoryID' });

// Allergy Category - Ingredient
AllergyCategory.hasMany(Ingredient, { foreignKey: 'CategoryID' });
Ingredient.belongsTo(AllergyCategory, { foreignKey: 'CategoryID' });

// Student - Monthly Meal Registration
Student.hasMany(MealRegistration, { foreignKey: 'StudentID' });
MealRegistration.belongsTo(Student, { foreignKey: 'StudentID' });

// Monthly Registration - Daily Selection (1 registration covers ~22 daily selections)
MealRegistration.hasMany(DailyMealSelection, { foreignKey: 'RegistrationID' });
DailyMealSelection.belongsTo(MealRegistration, { foreignKey: 'RegistrationID' });

// Student - Daily Selection
Student.hasMany(DailyMealSelection, { foreignKey: 'StudentID' });
DailyMealSelection.belongsTo(Student, { foreignKey: 'StudentID' });

// ==========================================
// 3. AUTOMATIC DATABASE SYNC FUNCTION
// ==========================================
const syncDatabase = async () => {
    try {
        await sequelize.sync({ alter: true }).then(() => {
            console.log('Database synced and relationships established successfully!');
        });
    } catch (error) {
        console.error('Database sync error:', error);
    }
};

// ==========================================
// 4. EXPORT MODELS
// ==========================================
module.exports = {
    sequelize,
    syncDatabase,
    User,
    Student,
    AllergyCategory,
    StudentAllergy,
    Supplier,
    Ingredient,
    MealRegistration,
    DailyMealSelection,
    Dish, 
    DailyMenu
};