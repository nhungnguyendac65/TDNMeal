const { DailyMealSelection, MealRegistration, Student, Dish, DailyMenu, StudentAllergy, AllergyCategory } = require('../models');

// ==========================================
// 1. ADVANCED ALLERGY SCREENING ALGORITHM
// ==========================================
exports.checkMenuAllergy = async (req, res) => {
    try {
        const { date, standardDishIds = [], vegetarianDishIds = [] } = req.body;

        if (!date) return res.status(400).json({ message: 'Vui lòng chọn ngày!' });

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
            include: [{
                model: MealRegistration, 
                where: { Status: 'Paid' },
                include: [{ 
                    model: Student,
                    include: [{
                        model: StudentAllergy,
                        include: [{ model: AllergyCategory }]
                    }]
                }]
            }]
        });

        const warnings = [];
        
        selections.forEach(sel => {
            const student = sel.MealRegistration?.Student;
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
                    className: 'Lớp ' + (student.ClassName || 'Chưa xếp'),
                    mealType: mealType === 'Standard' ? 'Suất Mặn' : 'Suất Chay',
                    studentAllergyNote: studentAllergyItems.join(', '),
                    conflictAllergens: conflictAllergens
                });
            }
        });

        res.status(200).json({
            status: warnings.length > 0 ? 'WARNING' : 'SAFE',
            message: warnings.length > 0 ? `Phát hiện ${warnings.length} ca có nguy cơ dị ứng!` : 'Thực đơn an toàn.',
            warnings
        });
    } catch (error) {
        console.error("Lỗi rà soát:", error);
        res.status(500).json({ message: 'Lỗi server khi rà soát dị ứng.' });
    }
};

// ==========================================
// 2. SAVE MENU (UPGRADED TO SAVE 8 DISHES & CHECK DUPLICATES)
// ==========================================
exports.createMenu = async (req, res) => {
    try {
        // Receive vegetarianDishIds from Frontend
        const { MenuDate, standardDishIds, vegetarianDishIds } = req.body;

        if (!MenuDate) return res.status(400).json({ message: 'Vui lòng chọn ngày!' });
        
        // 1. Check if menu already exists for this date to avoid unique constraint errors
        const existingMenu = await DailyMenu.findOne({ where: { MenuDate } });
        if (existingMenu) {
            return res.status(400).json({ message: 'Ngày này đã có thực đơn! Hãy chọn ngày khác.' });
        }

        // 2. Calculate Calories for Standard Meal (Main display standard)
        const stdDishes = await Dish.findAll({ where: { DishID: standardDishIds } });
        const stdCalories = stdDishes.reduce((sum, d) => sum + (Number(d.Calories) || 0), 0);

        // 3. Save to Database
        const newMenu = await DailyMenu.create({
            MenuDate,
            TotalCalories: stdCalories, // Lưu calo suất mặn vào cột chính
            Status: 'Submitted',
            // Store list of dish IDs as a string for Frontend use
            // (Ensure DailyMenu.js model has these 2 columns)
            StandardDishList: standardDishIds.join(','),
            VegetarianDishList: vegetarianDishIds ? vegetarianDishIds.join(',') : ''
        });

        res.status(201).json({ message: 'Đã lưu thực đơn và gửi chờ duyệt!', data: newMenu });
    } catch (error) {
        console.error("Lỗi lưu menu:", error);
        res.status(500).json({ message: 'Lỗi server khi lưu thực đơn.' });
    }
};

// ==========================================
// 3. GET MENU STATUS BY DATE
// ==========================================
exports.getMenuByDate = async (req, res) => {
    try {
        const { date } = req.params;
        const menu = await DailyMenu.findOne({ 
            where: { MenuDate: date } 
        });

        if (!menu) {
            return res.status(200).json({ data: null });
        }

        res.status(200).json({ data: menu });

    } catch (error) {
        console.error('Lỗi lấy menu theo ngày:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tìm thực đơn.' });
    }
};

// ==========================================
// 4. ADMIN: APPROVE OR REJECT
// ==========================================
exports.reviewMenu = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectReason } = req.body; // status: 'Approved' or 'Rejected'

        const menu = await DailyMenu.findByPk(id);
        if (!menu) return res.status(404).json({ message: 'Không tìm thấy thực đơn.' });

        await menu.update({
            Status: status,
            RejectReason: status === 'Rejected' ? rejectReason : null
        });

        res.status(200).json({ message: 'Cập nhật trạng thái thành công!' });
    } catch (error) {
        console.error('Lỗi duyệt menu:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi duyệt thực đơn.' });
    }
};

// ==========================================
// 5. GET ALL MENUS
// ==========================================
exports.getMenus = async (req, res) => {
    try {
        const menus = await DailyMenu.findAll({
            order: [['MenuDate', 'DESC']]
        });
        
        // Fetch all dishes for mapping
        const dishes = await Dish.findAll();
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
        console.error('Lỗi lấy danh sách menu:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tải danh sách thực đơn.' });
    }
};