const { DailyMealSelection, MealRegistration, DailyMenu, Dish } = require('../models');

exports.getSelections = async (req, res) => {
    try {
        const { studentId, month } = req.query; 
        const reg = await MealRegistration.findOne({ where: { StudentID: studentId, Month: month, Status: 'Paid' } });
        if (!reg) return res.status(200).json({ data: [] });
        const selections = await DailyMealSelection.findAll({ where: { RegistrationID: reg.RegistrationID || reg.id } });
        return res.status(200).json({ data: selections });
    } catch (error) { res.status(500).json({ message: 'Server error' }); }
};

exports.saveSelection = async (req, res) => {
    try {
        const { studentId, date, mealType } = req.body;
        const month = date.substring(0, 7); 
        
        const reg = await MealRegistration.findOne({ 
            where: { StudentID: studentId, Month: month, Status: 'Paid' } 
        });

        if (!reg) return res.status(403).json({ message: 'Payment not completed!' });

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
        
        return res.status(200).json({ message: 'Saved successfully!' });
    } catch (error) {
        console.error("Error saving dish:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// API TO GET REAL MENU FROM DATABASE
// ==========================================
exports.getWeeklyMenu = async (req, res) => {
    try {
        // 1. Lấy thực đơn đã được phê duyệt trong khoảng thời gian gần đây (30 ngày trước đến tương lai)
        const { Op } = require('sequelize');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateLimit = thirtyDaysAgo.toISOString().split('T')[0];

        const approvedMenus = await DailyMenu.findAll({
            where: { 
                Status: 'Approved',
                MenuDate: { [Op.gte]: dateLimit }
            },
            order: [['MenuDate', 'ASC']]
        });

        if (approvedMenus.length === 0) {
            return res.status(200).json({ data: {} });
        }

        // 2. Gom tất cả DishID cần thiết để truy vấn 1 lần duy nhất, tránh Dish.findAll() toàn bộ thư viện
        const allDishIds = new Set();
        approvedMenus.forEach(menu => {
            (menu.StandardDishList || '').split(',').filter(Boolean).forEach(id => allDishIds.add(parseInt(id)));
            (menu.VegetarianDishList || '').split(',').filter(Boolean).forEach(id => allDishIds.add(parseInt(id)));
        });

        const dishes = await Dish.findAll({
            where: { DishID: Array.from(allDishIds) }
        });

        const dishMap = {};
        dishes.forEach(d => {
            dishMap[d.DishID] = d;
        });

        // 3. Mapping dữ liệu theo cấu trúc Frontend mong đợi
        const result = {};

        approvedMenus.forEach(menu => {
            const dateStr = String(menu.MenuDate).substring(0, 10);
            
            const stdIds = (menu.StandardDishList || '').split(',').filter(Boolean);
            const vegIds = (menu.VegetarianDishList || '').split(',').filter(Boolean);

            const mapDish = (id) => {
                const dish = dishMap[id];
                if (!dish) return null;
                return {
                    id: dish.DishID,
                    name: dish.DishName, // Sửa từ .Name -> .DishName
                    type: dish.Type,
                    calories: dish.Calories,
                    allergens: (dish.Allergies || '').split(',').map(a => a.trim()).filter(Boolean),
                    ingredients: dish.MainIngredients || '', // Sửa từ .Ingredients -> .MainIngredients
                    supplier: dish.SupplierName || 'Nhà bếp Trần Đại Nghĩa', // Sửa từ .Supplier -> .SupplierName
                    imageUrl: dish.ImageUrl || ''
                };
            };

            result[dateStr] = {
                totalCalories: menu.TotalCalories || 0,
                vegCalories: menu.VegCalories || 0,
                status: menu.Status,
                standardDishes: stdIds.map(mapDish).filter(Boolean),
                vegetarianDishes: vegIds.map(mapDish).filter(Boolean)
            };
        });

        return res.status(200).json({ data: result });
    } catch (error) {
        console.error("Error fetching real menu:", error);
        res.status(500).json({ message: 'Server error while loading menu.' });
    }
};

// ==========================================
// [SUPER API] GET ALL WEEKLY CONTEXT IN 1 REQUEST
// To speed up loading on slow networks
// ==========================================
exports.getParentWeeklyContext = async (req, res) => {
    try {
        const { studentId, startDate } = req.query; // startDate: YYYY-MM-DD (Monday of the week)
        if (!studentId || !startDate) return res.status(400).json({ message: 'Missing information' });

        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + 4); // Get up to Friday

        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        // 1. Get relevant months (usually 1 or 2 months in a week)
        const targetMonths = [...new Set([
            startStr.substring(0, 7),
            endStr.substring(0, 7)
        ])];

        const { Op } = require('sequelize');

        // 2. Run necessary queries in parallel
        const [registrations, selections, approvedMenus] = await Promise.all([
            MealRegistration.findAll({ where: { StudentID: studentId, Month: targetMonths } }),
            DailyMealSelection.findAll({ where: { StudentID: studentId, Date: { [Op.between]: [startStr, endStr] } } }),
            DailyMenu.findAll({ where: { Status: 'Approved', MenuDate: { [Op.between]: [startStr, endStr] } } })
        ]);

        // 3. Get dish information from menus
        const allDishIds = new Set();
        approvedMenus.forEach(m => {
            (m.StandardDishList || '').split(',').filter(Boolean).forEach(id => allDishIds.add(parseInt(id)));
            (m.VegetarianDishList || '').split(',').filter(Boolean).forEach(id => allDishIds.add(parseInt(id)));
        });

        const dishes = await Dish.findAll({
            where: { DishID: Array.from(allDishIds) },
            attributes: ['DishID', 'DishName', 'Type', 'Calories', 'Allergies', 'MainIngredients', 'SupplierName', 'ImageUrl']
        });

        const dishMap = {};
        dishes.forEach(d => { dishMap[d.DishID] = d; });

        // 4. Format response data
        const formattedMenus = {};
        approvedMenus.forEach(menu => {
            const dateStr = menu.MenuDate;
            const mapDish = (id) => {
                const dish = dishMap[id];
                if (!dish) return null;
                return {
                    id: dish.DishID,
                    name: dish.DishName,
                    type: dish.Type,
                    calories: dish.Calories,
                    allergens: (dish.Allergies || '').split(',').map(a => a.trim()).filter(Boolean),
                    ingredients: dish.MainIngredients,
                    supplier: dish.SupplierName,
                    imageUrl: dish.ImageUrl
                };
            };

            formattedMenus[dateStr] = {
                totalCalories: menu.TotalCalories,
                vegCalories: menu.VegCalories,
                status: menu.Status,
                standardDishes: (menu.StandardDishList || '').split(',').filter(Boolean).map(mapDish).filter(Boolean),
                vegetarianDishes: (menu.VegetarianDishList || '').split(',').filter(Boolean).map(mapDish).filter(Boolean)
            };
        });

        const formattedStatuses = {};
        registrations.forEach(r => { formattedStatuses[r.Month] = r.Status === 'Paid'; });

        const formattedSelections = {};
        selections.forEach(s => { 
            const dStr = String(s.Date).substring(0, 10);
            formattedSelections[dStr] = s.MealType; 
        });

        return res.status(200).json({
            data: {
                statuses: formattedStatuses,
                selections: formattedSelections,
                menus: formattedMenus
            }
        });

    } catch (error) {
        console.error("Super API Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// [SUPER API] LẤY TẤT CẢ DỮ LIỆU TUẦN TRONG 1 REQUEST
// Giúp tăng tốc độ tải trên môi trường Ngrok/Mạng yếu
// ==========================================
exports.getParentWeeklyContext = async (req, res) => {
    try {
        const { studentId, startDate } = req.query; // startDate: YYYY-MM-DD (Thứ 2 của tuần)
        if (!studentId || !startDate) return res.status(400).json({ message: 'Thiếu thông tin' });

        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + 4); // Lấy đến Thứ 6

        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        // 1. Lấy thông tin các tháng liên quan (thường là 1 hoặc 2 tháng trong 1 tuần)
        const targetMonths = [...new Set([
            startStr.substring(0, 7),
            endStr.substring(0, 7)
        ])];

        const { Op } = require('sequelize');

        // 2. Chạy các query cần thiết song song
        const [registrations, selections, approvedMenus] = await Promise.all([
            MealRegistration.findAll({ where: { StudentID: studentId, Month: targetMonths } }),
            DailyMealSelection.findAll({ where: { StudentID: studentId, Date: { [Op.between]: [startStr, endStr] } } }),
            DailyMenu.findAll({ where: { Status: 'Approved', MenuDate: { [Op.between]: [startStr, endStr] } } })
        ]);

        // 3. Lấy thông tin món ăn từ thực đơn
        const allDishIds = new Set();
        approvedMenus.forEach(m => {
            (m.StandardDishList || '').split(',').filter(Boolean).forEach(id => allDishIds.add(parseInt(id)));
            (m.VegetarianDishList || '').split(',').filter(Boolean).forEach(id => allDishIds.add(parseInt(id)));
        });

        const dishes = await Dish.findAll({
            where: { DishID: Array.from(allDishIds) },
            attributes: ['DishID', 'DishName', 'Type', 'Calories', 'Allergies', 'MainIngredients', 'SupplierName', 'ImageUrl']
        });

        const dishMap = {};
        dishes.forEach(d => { dishMap[d.DishID] = d; });

        // 4. Format dữ liệu trả về
        const formattedMenus = {};
        approvedMenus.forEach(menu => {
            const dateStr = menu.MenuDate;
            const mapDish = (id) => {
                const dish = dishMap[id];
                if (!dish) return null;
                return {
                    id: dish.DishID,
                    name: dish.DishName,
                    type: dish.Type,
                    calories: dish.Calories,
                    allergens: (dish.Allergies || '').split(',').map(a => a.trim()).filter(Boolean),
                    ingredients: dish.MainIngredients,
                    supplier: dish.SupplierName,
                    imageUrl: dish.ImageUrl
                };
            };

            formattedMenus[dateStr] = {
                totalCalories: menu.TotalCalories,
                vegCalories: menu.VegCalories,
                status: menu.Status,
                standardDishes: (menu.StandardDishList || '').split(',').filter(Boolean).map(mapDish).filter(Boolean),
                vegetarianDishes: (menu.VegetarianDishList || '').split(',').filter(Boolean).map(mapDish).filter(Boolean)
            };
        });

        const formattedStatuses = {};
        registrations.forEach(r => { formattedStatuses[r.Month] = r.Status === 'Paid'; });

        const formattedSelections = {};
        selections.forEach(s => { 
            const dStr = String(s.Date).substring(0, 10);
            formattedSelections[dStr] = s.MealType; 
        });

        return res.status(200).json({
            data: {
                statuses: formattedStatuses,
                selections: formattedSelections,
                menus: formattedMenus
            }
        });

    } catch (error) {
        console.error("Lỗi Super API:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};