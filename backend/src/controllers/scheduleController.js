const { DailyMealSelection, MealRegistration, DailyMenu, Dish } = require('../models');

exports.getSelections = async (req, res) => {
    try {
        const { studentId, month } = req.query; 
        const reg = await MealRegistration.findOne({ where: { StudentID: studentId, Month: month, Status: 'Paid' } });
        if (!reg) return res.status(200).json({ data: [] });
        const selections = await DailyMealSelection.findAll({ where: { RegistrationID: reg.RegistrationID || reg.id } });
        return res.status(200).json({ data: selections });
    } catch (error) { res.status(500).json({ message: 'Lỗi server' }); }
};

exports.saveSelection = async (req, res) => {
    try {
        const { studentId, date, mealType } = req.body;
        const month = date.substring(0, 7); 
        
        const reg = await MealRegistration.findOne({ 
            where: { StudentID: studentId, Month: month, Status: 'Paid' } 
        });

        if (!reg) return res.status(403).json({ message: 'Chưa thanh toán!' });

        const regId = reg.RegistrationID || reg.id;

        const existing = await DailyMealSelection.findOne({ 
            where: { RegistrationID: regId, Date: date } 
        });

        if (existing) {
            existing.MealType = mealType; 
            await existing.save();
        } else {
            await DailyMealSelection.create({ 
                RegistrationID: regId, 
                StudentID: studentId, 
                Date: date, 
                MealType: mealType 
            });
        }
        
        return res.status(200).json({ message: 'Lưu thành công!' });
    } catch (error) {
        console.error("Lỗi lưu món ăn:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// ==========================================
// API TRẢ VỀ THỰC ĐƠN THẬT TỪ DATABASE
// ==========================================
exports.getWeeklyMenu = async (req, res) => {
    try {
        // Lấy toàn bộ thực đơn đã được Admin phê duyệt (Status = 'Approved')
        const approvedMenus = await DailyMenu.findAll({
            where: { Status: 'Approved' }
        });

        // Lấy toàn bộ danh sách món ăn để map ID sang thông tin chi tiết
        const dishes = await Dish.findAll();
        const dishMap = {};
        dishes.forEach(d => {
            dishMap[d.DishID || d.id] = d;
        });

        const result = {};

        approvedMenus.forEach(menu => {
            // Chuẩn hóa ngày thành YYYY-MM-DD để làm key
            const dateStr = String(menu.MenuDate).substring(0, 10);
            
            const stdIds = (menu.StandardDishList || '').split(',').filter(Boolean);
            const vegIds = (menu.VegetarianDishList || '').split(',').filter(Boolean);

            result[dateStr] = {
                totalCalories: menu.TotalCalories || 0,
                status: menu.Status,
                standardDishes: stdIds.map(id => {
                    const dish = dishMap[id];
                    if (!dish) return null;
                    return {
                        id: dish.DishID || dish.id,
                        name: dish.Name,
                        type: dish.Type,
                        calories: dish.Calories,
                        allergens: (dish.Allergies || '').split(',').map(a => a.trim()).filter(Boolean),
                        ingredients: dish.Ingredients || '',
                        supplier: dish.Supplier || 'Nhà bếp Trần Đại Nghĩa',
                        supplierLogo: dish.SupplierLogo || ''
                    };
                }).filter(Boolean),
                vegetarianDishes: vegIds.map(id => {
                    const dish = dishMap[id];
                    if (!dish) return null;
                    return {
                        id: dish.DishID || dish.id,
                        name: dish.Name,
                        type: dish.Type,
                        calories: dish.Calories,
                        allergens: (dish.Allergies || '').split(',').map(a => a.trim()).filter(Boolean),
                        ingredients: dish.Ingredients || '',
                        supplier: dish.Supplier || 'Nhà bếp Trần Đại Nghĩa',
                        supplierLogo: dish.SupplierLogo || ''
                    };
                }).filter(Boolean)
            };
        });

        // Trả về dữ liệu thực tế cho Frontend
        return res.status(200).json({ data: result });
    } catch (error) {
        console.error("Lỗi lấy thực đơn thật:", error);
        res.status(500).json({ message: 'Lỗi server khi tải thực đơn.' });
    }
};