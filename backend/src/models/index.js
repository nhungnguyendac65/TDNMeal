const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ==========================================
// 1. IMPORT TẤT CẢ CÁC BẢNG (MODELS)
// ==========================================
// Các bảng cũ (Dạng Class, không có đuôi sequelize)
const User = require('./User');
const Student = require('./Student');
const AllergyCategory = require('./AllergyCategory');
const Supplier = require('./Supplier');
const Ingredient = require('./Ingredient');
const Dish = require('./Dish');
const DailyMenu = require('./DailyMenu');


// Các bảng mới (Dạng Function, bắt buộc có đuôi sequelize)
const StudentAllergy = require('./studentAllergy')(sequelize);
const MealRegistration = require('./mealRegistration')(sequelize);
const DailyMealSelection = require('./dailyMealSelection')(sequelize); 

// ==========================================
// 2. KHAI BÁO MỐI QUAN HỆ (RELATIONSHIPS)
// ==========================================
// [ĐÃ SỬA]: Thêm as: 'children' và as: 'parent' để Controller gọi được
// Phụ huynh - Học sinh
User.hasMany(Student, { foreignKey: 'ParentID', as: 'children' });
Student.belongsTo(User, { foreignKey: 'ParentID', as: 'parent' });

// Học sinh - Dị ứng
Student.hasMany(StudentAllergy, { foreignKey: 'StudentID' });
StudentAllergy.belongsTo(Student, { foreignKey: 'StudentID' });

// Nhóm dị ứng - Chi tiết dị ứng
AllergyCategory.hasMany(StudentAllergy, { foreignKey: 'CategoryID' });
StudentAllergy.belongsTo(AllergyCategory, { foreignKey: 'CategoryID' });

// Nhóm dị ứng - Nguyên liệu
AllergyCategory.hasMany(Ingredient, { foreignKey: 'CategoryID' });
Ingredient.belongsTo(AllergyCategory, { foreignKey: 'CategoryID' });

// Học sinh - Đăng ký suất ăn tháng
Student.hasMany(MealRegistration, { foreignKey: 'StudentID' });
MealRegistration.belongsTo(Student, { foreignKey: 'StudentID' });

// Đăng ký tháng - Chọn món từng ngày (1 phiếu đăng ký tháng có ~22 ngày chọn món)
MealRegistration.hasMany(DailyMealSelection, { foreignKey: 'RegistrationID' });
DailyMealSelection.belongsTo(MealRegistration, { foreignKey: 'RegistrationID' });

// Học sinh - Chọn món từng ngày
Student.hasMany(DailyMealSelection, { foreignKey: 'StudentID' });
DailyMealSelection.belongsTo(Student, { foreignKey: 'StudentID' });

// ==========================================
// 3. HÀM ĐỒNG BỘ DATABASE TỰ ĐỘNG
// ==========================================
const syncDatabase = async () => {
    try {
        await sequelize.sync({ alter: true }).then(() => {
            console.log('Đã đồng bộ Database và thiết lập các mối quan hệ thành công!');
        });
    } catch (error) {
        console.error('Lỗi đồng bộ Database:', error);
    }
};

// ==========================================
// 4. XUẤT (EXPORT) ĐỂ CÁC NƠI KHÁC SỬ DỤNG
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