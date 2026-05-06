const { DailyMealSelection, MealRegistration, Student, Dish, DailyMenu, StudentAllergy, AllergyCategory } = require('../models');
exports.checkMenuAllergy = async (req, res) => {
    try {
        const { date, standardDishIds = [], vegetarianDishIds = [] } = req.body;
        if (!date) return res.status(400).json({ message: 'Please select a date!' });
        const standardDishes = await Dish.findAll({ where: { DishID: standardDishIds } });
        const vegetarianDishes = await Dish.findAll({ where: { DishID: vegetarianDishIds } });
        const extractAllergens = (dishes) => {
            return dishes
                .map(d => d.Allergies) 
                .filter(Boolean)
                .join(',')
                .split(',')
                .map(a => a.trim().toLowerCase())
                .filter(a => a !== '');
        };
        const standardAllergens = extractAllergens(standardDishes);
        const vegetarianAllergens = extractAllergens(vegetarianDishes);
        const selections = await DailyMealSelection.findAll({
            where: { Date: date },
            include: [
                {
                    model: Student,
                    include: [{
                        model: StudentAllergy,
                        include: [{ model: AllergyCategory }]
                    }]
                },
                {
                    model: MealRegistration,
                    where: { Status: 'Paid' } 
                }
            ]
        });
        const warnings = [];
        selections.forEach(sel => {
            const student = sel.Student; 
            if (!student || !student.StudentAllergies || student.StudentAllergies.length === 0) return;
            const studentAllergyItems = student.StudentAllergies.map(sa => {
                let name = sa.AllergyCategory?.CategoryName || '';
                let note = sa.SpecificNote || '';
                return `${name} ${note}`.trim().toLowerCase();
            });
            const allergyString = studentAllergyItems.join(' ');
            const mealType = sel.MealType; 
            const allergensToCheck = mealType === 'Standard' ? standardAllergens : vegetarianAllergens;
            let conflictAllergens = allergensToCheck.filter(a => allergyString.includes(a));
            if (conflictAllergens.length > 0) {
                warnings.push({
                    studentName: student.FullName,
                    className: 'Class ' + (student.ClassRoom || 'Unassigned'),
                    mealType: mealType === 'Standard' ? 'Standard Meal' : 'Vegetarian Meal',
                    studentAllergyNote: studentAllergyItems.join(', '),
                    conflictAllergens: conflictAllergens
                });
            }
        });
        res.status(200).json({
            status: warnings.length > 0 ? 'WARNING' : 'SAFE',
            message: warnings.length > 0 ? `Detected ${warnings.length} potential allergy risks!` : 'Menu is safe.',
            warnings
        });
    } catch (error) {
        console.error("Allergy check error:", error);
        res.status(500).json({ message: 'Server error during allergy check.' });
    }
};
exports.createMenu = async (req, res) => {
    try {
        const { MenuDate, standardDishIds, vegetarianDishIds } = req.body;
        if (!MenuDate) return res.status(400).json({ message: 'Please select a date!' });
        const existingMenu = await DailyMenu.findOne({ where: { MenuDate } });
        if (existingMenu) {
            return res.status(400).json({ message: 'A menu already exists for this date! Please choose another date.' });
        }
        const stdDishes = await Dish.findAll({ where: { DishID: standardDishIds } });
        const stdCalories = stdDishes.reduce((sum, d) => sum + (Number(d.Calories) || 0), 0);
        const newMenu = await DailyMenu.create({
            MenuDate,
            TotalCalories: stdCalories, 
            Status: 'Submitted',
            StandardDishList: standardDishIds.join(','),
            VegetarianDishList: vegetarianDishIds ? vegetarianDishIds.join(',') : ''
        });
        res.status(201).json({ message: 'Menu saved and sent for approval!', data: newMenu });
    } catch (error) {
        console.error("Save menu error:", error);
        res.status(500).json({ message: 'Server error while saving menu.' });
    }
};
exports.getMenuByDate = async (req, res) => {
    try {
        const { date } = req.params;
        const menu = await DailyMenu.findOne({ 
            where: { MenuDate: date } 
        });
        const standardCount = await DailyMealSelection.count({ where: { Date: date, MealType: 'Standard' } });
        const vegetarianCount = await DailyMealSelection.count({ where: { Date: date, MealType: 'Vegetarian' } });
        const noneCount = await DailyMealSelection.count({ where: { Date: date, MealType: 'None' } });
        
        const counts = {
            Standard: standardCount,
            Vegetarian: vegetarianCount,
            None: noneCount
        };

        if (!menu) {
            return res.status(200).json({ data: null, counts });
        }
        res.status(200).json({ data: menu, counts });
    } catch (error) {
        console.error('Fetch menu error:', error);
        res.status(500).json({ message: 'System error while fetching menu.' });
    }
};
exports.reviewMenu = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectReason } = req.body; 
        const menu = await DailyMenu.findByPk(id);
        if (!menu) return res.status(404).json({ message: 'Menu not found.' });
        await menu.update({
            Status: status,
            RejectReason: status === 'Rejected' ? rejectReason : null
        });
        res.status(200).json({ message: 'Status updated successfully!' });
    } catch (error) {
        console.error('Review menu error:', error);
        res.status(500).json({ message: 'System error while reviewing menu.' });
    }
};
exports.getMenus = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const { Op } = require('sequelize');
        let whereClause = {};
        if (startDate && endDate) {
            whereClause.MenuDate = {
                [Op.between]: [startDate, endDate]
            };
        }
        const menus = await DailyMenu.findAll({
            where: whereClause,
            order: [['MenuDate', 'DESC']]
        });
        if (menus.length === 0) {
            return res.status(200).json({ data: [] });
        }
        const allDishIds = new Set();
        menus.forEach(m => {
            (m.StandardDishList || '').split(',').filter(Boolean).forEach(id => allDishIds.add(parseInt(id)));
            (m.VegetarianDishList || '').split(',').filter(Boolean).forEach(id => allDishIds.add(parseInt(id)));
        });
        const dishes = await Dish.findAll({
            where: { DishID: Array.from(allDishIds) }
        });
        const dishMap = {};
        dishes.forEach(d => { dishMap[d.DishID] = d; });
        const formattedMenus = menus.map(m => {
            const stdIds = (m.StandardDishList || '').split(',').filter(Boolean);
            const vegIds = (m.VegetarianDishList || '').split(',').filter(Boolean);
            return {
                id: m.MenuID,
                date: m.MenuDate,
                status: m.Status,
                totalCalories: m.TotalCalories,
                rejectReason: m.RejectReason,
                standardDishes: stdIds.map(id => dishMap[id]).filter(Boolean),
                vegetarianDishes: vegIds.map(id => dishMap[id]).filter(Boolean)
            };
        });
        res.status(200).json({ data: formattedMenus });
    } catch (error) {
        console.error('Fetch menu list error:', error);
        res.status(500).json({ message: 'System error while loading menu list.' });
    }
};