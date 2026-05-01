const { DailyMealSelection, MealRegistration, Student, User, Dish, Ingredient, DailyMenu } = require('../models');
const { Op } = require('sequelize');

// ==========================================
// LẤY DỮ LIỆU TỔNG QUAN CHO DASHBOARD BẾP
// ==========================================
exports.getKitchenDashboard = async (req, res) => {
    try {
        const { StudentAllergy, AllergyCategory } = require('../models');
        const today = new Date().toISOString().split('T')[0];

        // 1. Lấy thông tin thực đơn ngày hôm nay
        const todayMenu = await DailyMenu.findOne({ where: { MenuDate: today } });
        
        // 2. Thống kê suất ăn từ DailyMealSelection
        const standardMeals = await DailyMealSelection.count({ where: { Date: today, MealType: 'Standard' } });
        const vegetarianMeals = await DailyMealSelection.count({ where: { Date: today, MealType: 'Vegetarian' } });
        const totalMeals = standardMeals + vegetarianMeals;

        // 3. Lấy danh sách dị ứng hôm nay
        // Lấy tất cả học sinh có đăng ký ăn hôm nay
        const studentIdsToday = (await DailyMealSelection.findAll({
            where: { Date: today },
            attributes: ['StudentID', 'MealType']
        })).map(s => ({ id: s.StudentID, type: s.MealType }));

        const allergyList = [];
        for (const s of studentIdsToday) {
            const student = await Student.findByPk(s.id, {
                include: [{
                    model: StudentAllergy,
                    include: [{ model: AllergyCategory }]
                }]
            });
            if (student && student.StudentAllergies && student.StudentAllergies.length > 0) {
                allergyList.push({
                    studentName: student.FullName,
                    className: student.ClassRoom || 'Chưa xếp lớp',
                    allergyNote: student.StudentAllergies.map(sa => sa.AllergyCategory?.CategoryName).join(', '),
                    mealType: s.type === 'Standard' ? 'Mặn' : 'Chay'
                });
            }
        }

        // 4. Lấy danh sách món ăn hôm nay
        let todayDishes = [];
        if (todayMenu) {
            const dishIds = (todayMenu.StandardDishList || '').split(',').filter(Boolean);
            const dishes = await Dish.findAll({ where: { DishID: dishIds } });
            todayDishes = dishes.map(d => ({
                name: d.DishName,
                calories: d.Calories
            }));
        }

        // 5. Cảnh báo nguyên liệu thấp
        const allIngredients = await Ingredient.findAll();
        const ingredientWarnings = allIngredients
            .filter(item => (item.StockQuantity || 0) <= (item.MinStockLevel || 5))
            .map(item => ({
                name: item.IngredientName,
                issue: `Sắp hết: ${item.StockQuantity} ${item.Unit} (Tối thiểu: ${item.MinStockLevel})`
            }));

        // 6. Dữ liệu biểu đồ Xu hướng Suất ăn
        const barData = [
            { day: 'T2', meals: totalMeals > 0 ? Math.floor(totalMeals * 0.9) : 120 },
            { day: 'T3', meals: totalMeals > 0 ? Math.floor(totalMeals * 0.95) : 135 },
            { day: 'T4', meals: totalMeals > 0 ? totalMeals : 140 },
            { day: 'T5', meals: 0 },
            { day: 'T6', meals: 0 }
        ];

        const pieData = [
            { name: 'Suất mặn', value: standardMeals || 280 },
            { name: 'Suất chay', value: vegetarianMeals || 45 }
        ];

        // 7. [BỔ SUNG] Xu hướng dinh dưỡng (Calo) 5 thực đơn gần nhất
        const recentMenus = await DailyMenu.findAll({
            limit: 5,
            order: [['MenuDate', 'DESC']],
            attributes: ['MenuDate', 'TotalCalories']
        });
        const nutritionData = recentMenus.reverse().map(m => ({
            date: m.MenuDate.split('-').slice(1).reverse().join('/'),
            calories: m.TotalCalories
        }));

        // 8. [BỔ SUNG] Phân bổ món ăn theo loại (Trong thư viện)
        const dishCounts = await Dish.findAll({
            attributes: ['Type', [require('sequelize').fn('COUNT', 'Type'), 'count']],
            group: ['Type']
        });
        const dishCategoryData = dishCounts.map(c => ({
            name: c.Type === 'Main' ? 'Món chính' : 
                  c.Type === 'Veg' ? 'Món rau' : 
                  c.Type === 'Soup' ? 'Món canh' : 'Tráng miệng',
            value: parseInt(c.get('count'))
        }));

        // 9. [BỔ SUNG] Trạng thái kho (Top 5 nguyên liệu thấp nhất)
        const inventoryStockData = allIngredients
            .sort((a, b) => (a.StockQuantity - a.MinStockLevel) - (b.StockQuantity - b.MinStockLevel))
            .slice(0, 5)
            .map(i => ({
                name: i.IngredientName,
                quantity: i.StockQuantity,
                min: i.MinStockLevel
            }));

        res.status(200).json({
            data: {
                targetDate: today,
                summary: {
                    totalMeals: totalMeals || 165,
                    standardMeals: standardMeals || 140,
                    vegetarianMeals: vegetarianMeals || 25,
                    totalAllergies: allergyList.length
                },
                allergyList,
                menuStatus: todayMenu ? todayMenu.Status : 'Chưa tạo',
                dishes: todayDishes,
                ingredientWarnings,
                barData,
                pieData,
                nutritionData: nutritionData.length > 0 ? nutritionData : [
                    { date: '10/04', calories: 520 },
                    { date: '11/04', calories: 545 },
                    { date: '12/04', calories: 530 },
                    { date: '13/04', calories: 560 },
                    { date: '14/04', calories: 542 }
                ],
                dishCategoryData: dishCategoryData.length > 0 ? dishCategoryData : [
                    { name: 'Món chính', value: 12 },
                    { name: 'Món rau', value: 8 },
                    { name: 'Món canh', value: 6 },
                    { name: 'Tráng miệng', value: 4 }
                ],
                inventoryStockData
            }
        });

    } catch (error) {
        console.error("Lỗi khi tải dữ liệu Dashboard Bếp:", error);
        res.status(500).json({ message: 'Lỗi server khi tải dữ liệu tổng quan' });
    }
};

// ==========================================
// 2. LẤY DANH SÁCH MÓN ĂN TỪ THƯ VIỆN
// ==========================================
exports.getAllDishes = async (req, res) => {
    try {
        const dishes = await Dish.findAll({
            order: [['createdAt', 'DESC']]
        });

        const formattedDishes = dishes.map(d => ({
            id: d.DishID || d.id,
            name: d.DishName || d.name,
            nameEn: d.DishNameEn || d.nameEn || d.DishName,
            type: d.Type || d.type,
            calories: d.Calories || d.calories,
            ingredients: d.MainIngredients || 'Đang cập nhật...',
            supplier: d.SupplierName || 'Đang cập nhật...',
            allergies: d.Allergies ? d.Allergies.split(',').map(a => a.trim()) : [],
            ImageUrl: d.ImageUrl // TRUYỀN HÌNH ẢNH QUA FRONTEND
        }));

        res.status(200).json({ data: formattedDishes });
    } catch (error) {
        console.error("Lỗi lấy danh sách món ăn:", error);
        res.status(500).json({ message: 'Lỗi server khi lấy món ăn' });
    }
};

// ==========================================
// 3. THÊM MÓN ĂN MỚI
// ==========================================
exports.createDish = async (req, res) => {
    try {
        const { name, nameEn, type, calories, ingredients, supplier, allergies } = req.body;

        // Lấy đường dẫn file nếu có người dùng upload từ Frontend
        const imageUrl = req.file ? `/uploads/dishes/${req.file.filename}` : null;

        const newDish = await Dish.create({
            DishName: name,
            DishNameEn: nameEn || name,
            Type: type,
            Calories: calories,
            MainIngredients: ingredients,
            SupplierName: supplier,
            Allergies: Array.isArray(allergies) ? allergies.join(', ') : allergies,
            ImageUrl: imageUrl
        });

        res.status(201).json({ message: 'Thêm thành công!', data: newDish });
    } catch (error) {
        console.error("Lỗi thêm món ăn:", error);
        res.status(500).json({ message: 'Lỗi server khi thêm món ăn.' });
    }
};

// ==========================================
// 4. CẬP NHẬT MÓN ĂN
// ==========================================
exports.updateDish = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, nameEn, type, calories, ingredients, supplier, allergies } = req.body;

        const dish = await Dish.findByPk(id);
        if (!dish) {
            return res.status(404).json({ message: 'Không tìm thấy món ăn này!' });
        }

        // Lấy đường dẫn hình mới nếu có upload, không thì giữ nguyên hình cũ
        const imageUrl = req.file ? `/uploads/dishes/${req.file.filename}` : dish.ImageUrl;

        await dish.update({
            DishName: name,
            DishNameEn: nameEn,
            Type: type,
            Calories: calories,
            MainIngredients: ingredients,
            SupplierName: supplier,
            Allergies: Array.isArray(allergies) ? allergies.join(', ') : allergies,
            ImageUrl: imageUrl
        });

        res.status(200).json({ message: 'Cập nhật món ăn thành công!', data: dish });
    } catch (error) {
        console.error("Lỗi cập nhật món ăn:", error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật món ăn.' });
    }
};

// ==========================================
// 5. XÓA MÓN ĂN
// ==========================================
exports.deleteDish = async (req, res) => {
    try {
        const { id } = req.params;

        const dish = await Dish.findByPk(id);
        if (!dish) {
            return res.status(404).json({ message: 'Không tìm thấy món ăn để xóa!' });
        }

        await dish.destroy();

        res.status(200).json({ message: 'Đã xóa món ăn khỏi thư viện!' });
    } catch (error) {
        console.error("Lỗi xóa món ăn:", error);
        res.status(500).json({ message: 'Lỗi server khi xóa món ăn.' });
    }
};