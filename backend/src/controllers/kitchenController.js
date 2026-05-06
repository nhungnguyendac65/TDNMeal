const { DailyMealSelection, MealRegistration, Student, User, Dish, Ingredient, DailyMenu } = require('../models');
const { Op } = require('sequelize');
exports.getKitchenDashboard = async (req, res) => {
    try {
        const { StudentAllergy, AllergyCategory } = require('../models');
        const today = new Date().toISOString().split('T')[0];
        const [todayMenu, standardMeals, vegetarianMeals, allIngredients, recentMenus, dishCounts] = await Promise.all([
            DailyMenu.findOne({ where: { MenuDate: today } }),
            DailyMealSelection.count({ where: { Date: today, MealType: 'Standard' } }),
            DailyMealSelection.count({ where: { Date: today, MealType: 'Vegetarian' } }),
            Ingredient.findAll({ attributes: ['IngredientName', 'StockQuantity', 'MinStockLevel', 'Unit'] }),
            DailyMenu.findAll({
                limit: 5,
                order: [['MenuDate', 'DESC']],
                attributes: ['MenuDate', 'TotalCalories']
            }),
            Dish.findAll({
                attributes: ['Type', [require('sequelize').fn('COUNT', 'Type'), 'count']],
                group: ['Type']
            })
        ]);
        const totalMeals = standardMeals + vegetarianMeals;
        const studentSelectionsToday = await DailyMealSelection.findAll({
            where: { Date: today },
            include: [
                {
                    model: Student,
                    include: [{
                        model: StudentAllergy,
                        include: [{ model: AllergyCategory }]
                    }]
                }
            ]
        });
        const allergyList = [];
        studentSelectionsToday.forEach(sel => {
            const student = sel.Student;
            if (student && student.StudentAllergies && student.StudentAllergies.length > 0) {
                allergyList.push({
                    studentName: student.FullName,
                    className: student.ClassRoom || 'Chưa xếp lớp',
                    allergyNote: student.StudentAllergies.map(sa => sa.AllergyCategory?.CategoryName).join(', '),
                    mealType: sel.MealType === 'Standard' ? 'Mặn' : 'Chay'
                });
            }
        });
        let todayDishes = [];
        if (todayMenu) {
            const dishIds = (todayMenu.StandardDishList || '').split(',').filter(Boolean);
            const dishes = await Dish.findAll({ 
                where: { DishID: dishIds },
                attributes: ['DishName', 'Calories']
            });
            todayDishes = dishes.map(d => ({
                name: d.DishName,
                calories: d.Calories
            }));
        }
        const ingredientWarnings = allIngredients
            .filter(item => (item.StockQuantity || 0) <= (item.MinStockLevel || 5))
            .map(item => ({
                name: item.IngredientName,
                issue: `Sắp hết: ${item.StockQuantity} ${item.Unit} (Tối thiểu: ${item.MinStockLevel})`
            }));
        const curr = new Date();
        const monday = new Date(curr.setDate(curr.getDate() - curr.getDay() + 1)).toISOString().split('T')[0];
        const friday = new Date(curr.setDate(curr.getDate() - curr.getDay() + 5)).toISOString().split('T')[0];
        const selectionsByDay = await DailyMealSelection.findAll({
            where: { Date: { [Op.between]: [monday, friday] } },
            attributes: ['Date', [require('sequelize').fn('COUNT', 'Date'), 'count']],
            group: ['Date']
        });
        const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6'];
        const barDataMap = {};
        selectionsByDay.forEach(s => {
            const d = String(s.Date).substring(0, 10);
            barDataMap[d] = parseInt(s.get('count'));
        });
        const barData = [];
        const iter = new Date(monday);
        for (let i = 0; i < 5; i++) {
            const dStr = iter.toISOString().split('T')[0];
            barData.push({ day: dayNames[i], meals: barDataMap[dStr] || 0 });
            iter.setDate(iter.getDate() + 1);
        }
        const pieData = [
            { name: 'Suất mặn', value: standardMeals },
            { name: 'Suất chay', value: vegetarianMeals }
        ];
        const nutritionData = recentMenus.reverse().map(m => ({
            date: m.MenuDate.split('-').slice(1).reverse().join('/'),
            calories: m.TotalCalories
        }));
        const dishCategoryData = dishCounts.map(c => ({
            name: c.Type === 'Main' ? 'Món chính' : 
                  c.Type === 'Veg' ? 'Món rau' : 
                  c.Type === 'Soup' ? 'Món canh' : 'Tráng miệng',
            value: parseInt(c.get('count'))
        }));
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
                    totalMeals,
                    standardMeals,
                    vegetarianMeals,
                    totalAllergies: allergyList.length
                },
                allergyList,
                menuStatus: todayMenu ? todayMenu.Status : 'Chưa tạo',
                dishes: todayDishes,
                ingredientWarnings,
                barData,
                pieData,
                nutritionData,
                dishCategoryData,
                inventoryStockData
            }
        });
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu Dashboard Bếp:", error);
        res.status(500).json({ message: 'Lỗi server khi tải dữ liệu tổng quan' });
    }
};
exports.getAllDishes = async (req, res) => {
    try {
        const dishes = await Dish.findAll({
            order: [['createdAt', 'DESC']]
        });
        const formattedDishes = dishes.map(d => ({
            id: d.DishID,
            name: d.DishName,
            nameEn: d.DishNameEn || d.DishName,
            type: d.Type,
            calories: d.Calories,
            ingredients: d.MainIngredients || 'Đang cập nhật...',
            supplier: d.SupplierName || 'Đang cập nhật...',
            allergies: d.Allergies ? d.Allergies.split(',').map(a => a.trim()) : [],
            ImageUrl: d.ImageUrl 
        }));
        res.status(200).json({ data: formattedDishes });
    } catch (error) {
        console.error("Lỗi lấy danh sách món ăn:", error);
        res.status(500).json({ message: 'Lỗi server khi lấy món ăn' });
    }
};
exports.createDish = async (req, res) => {
    try {
        const { name, nameEn, type, calories, ingredients, supplier, allergies } = req.body;
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
exports.updateDish = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, nameEn, type, calories, ingredients, supplier, allergies } = req.body;
        const dish = await Dish.findByPk(id);
        if (!dish) {
            return res.status(404).json({ message: 'Không tìm thấy món ăn này!' });
        }
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

exports.getMealCountsByDate = async (req, res) => {
    try {
        const { date } = req.params;
        const [standard, vegetarian, none] = await Promise.all([
            DailyMealSelection.count({ where: { Date: date, MealType: 'Standard' } }),
            DailyMealSelection.count({ where: { Date: date, MealType: 'Vegetarian' } }),
            DailyMealSelection.count({ where: { Date: date, MealType: 'None' } })
        ]);
        res.status(200).json({
            data: {
                Standard: standard,
                Vegetarian: vegetarian,
                None: none
            }
        });
    } catch (error) {
        console.error("Lỗi lấy số lượng suất ăn:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};