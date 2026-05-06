const { User } = require('../models');

// 1. Get all accounts list
exports.getAllUsers = async (req, res) => {
    try {
        const { Student } = require('../models');
        const users = await User.findAll({
            attributes: ['UserID', 'Username', 'FullName', 'Role', 'Phone', 'Status', 'ClassRoom', 'createdAt'],
            include: [{
                model: Student,
                as: 'children',
                attributes: ['FullName', 'ClassRoom']
            }],
            order: [['createdAt', 'DESC']]
        });

        const formattedData = users.map(u => ({
            id: u.UserID,
            username: u.Username || u.Phone,
            fullName: u.FullName,
            role: u.Role,
            phone: u.Phone,
            status: u.Status,
            createdAt: u.createdAt,
            classRoom: u.ClassRoom || '',
            studentName: (u.children && u.children.length > 0) ? u.children[0].FullName : '',
            studentClassRoom: (u.children && u.children.length > 0) ? u.children[0].ClassRoom : ''
        }));

        res.status(200).json({ data: formattedData });
    } catch (error) {
        console.error("Error fetching User list:", error);
        res.status(500).json({ message: 'Server error while loading user list' });
    }
};

// 2. Create new account

exports.createUser = async (req, res) => {
    try {
        const { username, password, fullName, role, phone, classRoom, studentName, studentClassRoom } = req.body; const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password || '123456', 10);

        const newUser = await User.create({
            Username: username,
            PasswordHash: hashedPassword,
            FullName: fullName,
            Role: role,
            Phone: phone || username,
            Status: 'Active',
            ClassRoom: role === 'Teacher' ? classRoom : null
        });

        if (role === 'Parent' && studentName) {
            const { Student } = require('../models');
            await Student.create({
                FullName: studentName,
                ClassRoom: studentClassRoom || 'Unassigned',
                ParentID: newUser.UserID,
                Gender: 'Male',
                Height: 0,
                Weight: 0,
                HealthProfileCompleted: false
            });
        }

        res.status(201).json({ message: 'Account created successfully!' });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: 'Username or Phone number already exists!' });
    }
};

// 3. Update information
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, role, phone, status, classRoom, password, studentName, studentClassRoom } = req.body;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'Account not found!' });

        const updateData = {
            FullName: fullName,
            Role: role,
            Phone: phone,
            Status: status,
            ClassRoom: role === 'Teacher' ? classRoom : null
        };

        if (password && password.trim() !== '') {
            const bcrypt = require('bcrypt');
            updateData.PasswordHash = await bcrypt.hash(password, 10);
        }

        await user.update(updateData);

        if (role === 'Parent' && studentName) {
            const { Student } = require('../models');
            const existingStudent = await Student.findOne({ where: { ParentID: user.UserID } });
            if (existingStudent) {
                await existingStudent.update({
                    FullName: studentName,
                    ClassRoom: studentClassRoom || existingStudent.ClassRoom
                });
            } else {
                await Student.create({
                    FullName: studentName,
                    ClassRoom: studentClassRoom || 'Unassigned',
                    ParentID: user.UserID,
                    Gender: 'Male',
                    Height: 0,
                    Weight: 0,
                    HealthProfileCompleted: false
                });
            }
        }

        res.status(200).json({ message: 'Updated successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// 4. Delete account
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'Not found!' });

        await user.destroy();
        res.status(200).json({ message: 'Deleted!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// 5. Admin Dashboard Statistics
const { Student, MealRegistration, DailyMenu, StudentAllergy, AllergyCategory, DailyMealSelection } = require('../models');

exports.getAdminStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Total registered students
        const totalStudents = await Student.count();

        // 2. Meal selections today (DailyMealSelection for today)
        const mealsToday = await DailyMealSelection.count({ where: { Date: today } });

        // 3. Menus awaiting approval
        const pendingMenusRaw = await DailyMenu.findAll({ 
            where: { Status: 'Submitted' },
            order: [['MenuDate', 'ASC']]
        });
        
        const pendingMenus = pendingMenusRaw.map(m => ({ id: m.MenuID, date: m.MenuDate, status: m.Status }));

        // 4. Unpaid registrations
        const unpaidCount = await MealRegistration.count({ where: { Status: 'Pending Payment' } });

        // 5. Allergy warnings
        const recentAllergiesRaw = await StudentAllergy.findAll({
            include: [
                { model: Student, attributes: ['FullName'] },
                { model: AllergyCategory, attributes: ['CategoryName'] }
            ],
            limit: 5,
            order: [['id', 'DESC']]
        });
        
        const recentAllergies = recentAllergiesRaw.map(a => ({
            id: a.id,
            studentName: a.Student?.FullName || 'Anonymous',
            allergy: a.AllergyCategory?.CategoryName || 'Other',
            note: a.SpecificNote || ''
        }));

        // 6. Today's menu
        const todayMenuData = await DailyMenu.findOne({ where: { MenuDate: today } });
        let todayMenu = null;
        if (todayMenuData) {
            let standardDishes = [];
            let vegDishes = [];
            try { standardDishes = JSON.parse(todayMenuData.StandardDishList || '[]'); } catch(e){}
            try { vegDishes = JSON.parse(todayMenuData.VegetarianDishList || '[]'); } catch(e){}
            
            todayMenu = {
                status: todayMenuData.Status,
                totalCalories: todayMenuData.TotalCalories,
                standardCount: standardDishes.length,
                vegCount: vegDishes.length
            };
        }

        // 7. Bar chart data (Weekly meal trends: Mon -> Fri)
        const barData = [];
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        
        // Calculate Monday of current week
        const curr = new Date();
        const first = curr.getDate() - curr.getDay() + 1; // Monday
        
        for (let i = 0; i < 5; i++) {
            const dayDate = new Date(curr.setDate(first + i)).toISOString().split('T')[0];
            const count = await DailyMealSelection.count({ where: { Date: dayDate } });
            barData.push({ day: dayNames[i], meals: count });
            // Reset curr for next calculation
            curr.setDate(first + i); 
        }

        // 8. Pie chart data (Standard / Vegetarian distribution today)
        const standardCount = await DailyMealSelection.count({ where: { Date: today, MealType: 'Standard' } });
        const vegetarianCount = await DailyMealSelection.count({ where: { Date: today, MealType: 'Vegetarian' } });

        const pieData = [
            { name: 'Standard', value: standardCount },
            { name: 'Vegetarian', value: vegetarianCount }
        ];

        res.status(200).json({
            data: {
                studentCount: totalStudents,
                mealsToday: mealsToday,
                pendingMenuCount: pendingMenus.length,
                pendingMenus: pendingMenus.slice(0, 4),
                unpaidCount: unpaidCount,
                recentAllergies,
                todayMenu,
                barData,
                pieData
            }
        });
    } catch (error) {
        console.error("Error in getAdminStats:", error);
        res.status(500).json({ message: 'Statistics error' });
    }
};