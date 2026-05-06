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
                    className: student.ClassRoom || 'Unassigned',
                    allergyNote: student.StudentAllergies.map(sa => sa.AllergyCategory?.CategoryName).join(', '),
                    mealType: sel.MealType === 'Standard' ? 'Standard' : 'Vegetarian'
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
                issue: `Low stock: ${item.StockQuantity} ${item.Unit} (Min: ${item.MinStockLevel})`
            }));
        const curr = new Date();
        const monday = new Date(curr.setDate(curr.getDate() - curr.getDay() + 1)).toISOString().split('T')[0];
        const friday = new Date(curr.setDate(curr.getDate() - curr.getDay() + 5)).toISOString().split('T')[0];
        const selectionsByDay = await DailyMealSelection.findAll({
            where: { Date: { [Op.between]: [monday, friday] } },
            attributes: ['Date', [require('sequelize').fn('COUNT', 'Date'), 'count']],
            group: ['Date']
        });
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
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
            { name: 'Standard Meal', value: standardMeals },
            { name: 'Vegetarian Meal', value: vegetarianMeals }
        ];
        const nutritionData = recentMenus.reverse().map(m => ({
            date: m.MenuDate.split('-').slice(1).reverse().join('/'),
            calories: m.TotalCalories
        }));
        const dishCategoryData = dishCounts.map(c => ({
            name: c.Type === 'Main' ? 'Main Dish' : 
                  c.Type === 'Veg' ? 'Veggie Dish' : 
                  c.Type === 'Soup' ? 'Soup' : 'Dessert',
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
                menuStatus: todayMenu ? todayMenu.Status : 'Not created',
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
        console.error("Error while loading Kitchen Dashboard data:", error);
        res.status(500).json({ message: 'Server error while loading overview data' });
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
            ingredients: d.MainIngredients || 'Updating...',
            supplier: d.SupplierName || 'Updating...',
            allergies: d.Allergies ? d.Allergies.split(',').map(a => a.trim()) : [],
            ImageUrl: d.ImageUrl 
        }));
        res.status(200).json({ data: formattedDishes });
    } catch (error) {
        console.error("Error fetching dish list:", error);
        res.status(500).json({ message: 'Server error while fetching dishes' });
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
        res.status(201).json({ message: 'Added successfully!', data: newDish });
    } catch (error) {
        console.error("Error adding dish:", error);
        res.status(500).json({ message: 'Server error while adding dish.' });
    }
};
exports.updateDish = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, nameEn, type, calories, ingredients, supplier, allergies } = req.body;
        const dish = await Dish.findByPk(id);
        if (!dish) {
            return res.status(404).json({ message: 'Dish not found!' });
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
        res.status(200).json({ message: 'Dish updated successfully!', data: dish });
    } catch (error) {
        console.error("Error updating dish:", error);
        res.status(500).json({ message: 'Server error while updating dish.' });
    }
};
exports.deleteDish = async (req, res) => {
    try {
        const { id } = req.params;
        const dish = await Dish.findByPk(id);
        if (!dish) {
            return res.status(404).json({ message: 'Dish not found for deletion!' });
        }
        await dish.destroy();
        res.status(200).json({ message: 'Dish deleted from library!' });
    } catch (error) {
        console.error("Error deleting dish:", error);
        res.status(500).json({ message: 'Server error while deleting dish.' });
    }
};