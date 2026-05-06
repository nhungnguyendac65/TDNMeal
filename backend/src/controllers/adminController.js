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
        console.error("Lỗi lấy danh sách User:", error);
        res.status(500).json({ message: 'Lỗi server khi tải danh sách người dùng' });
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
                ClassRoom: studentClassRoom || 'Chưa xếp lớp',
                ParentID: newUser.UserID,
                Gender: 'Male',
                Height: 0,
                Weight: 0,
                HealthProfileCompleted: false
            });
        }

        res.status(201).json({ message: 'Tạo tài khoản thành công!' });
    } catch (error) {
        console.error("Lỗi:", error);
        res.status(500).json({ message: 'Tên đăng nhập hoặc SĐT đã tồn tại!' });
    }
};

// 3. Update account info
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, role, phone, status, classRoom, password, studentName, studentClassRoom } = req.body;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });

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
                    ClassRoom: studentClassRoom || 'Chưa xếp lớp',
                    ParentID: user.UserID,
                    Gender: 'Male',
                    Height: 0,
                    Weight: 0,
                    HealthProfileCompleted: false
                });
            }
        }

        res.status(200).json({ message: 'Cập nhật thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// 4. Delete account
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy!' });

        await user.destroy();
        res.status(200).json({ message: 'Đã xóa!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// 5. Admin Dashboard Statistics
const { Student, MealRegistration, DailyMenu, StudentAllergy, AllergyCategory, DailyMealSelection } = require('../models');

exports.getAdminStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Total registered students
        const totalStudents = await Student.count();

        // 2. Number of meal registrations today (DailyMealSelection for today)
        const mealsToday = await DailyMealSelection.count({ where: { Date: today } });

        // 3. Menus pending approval
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
            studentName: a.Student?.FullName || 'Ẩn danh',
            allergy: a.AllergyCategory?.CategoryName || 'Khác',
            note: a.SpecificNote || ''
        }));

        // 6. Today's menu
        const todayMenuData = await DailyMenu.findOne({ where: { MenuDate: today } });
        let todayMenu = null;
        if (todayMenuData) {
            let standardDishes = [];
            let vegDishes = [];
            // Dishes are stored as comma-separated ID strings (e.g., "1,5,8,12")
            standardDishes = (todayMenuData.StandardDishList || '').split(',').filter(Boolean);
            vegDishes = (todayMenuData.VegetarianDishList || '').split(',').filter(Boolean);
            
            todayMenu = {
                status: todayMenuData.Status,
                totalCalories: todayMenuData.TotalCalories,
                standardCount: standardDishes.length,
                vegCount: vegDishes.length
            };
        }

        // 7. Mock chart data
        const barData = [
            { day: 'T2', meals: 120 },
            { day: 'T3', meals: 135 },
            { day: 'T4', meals: Math.max(mealsToday, 140) },
            { day: 'T5', meals: 0 },
            { day: 'T6', meals: 0 }
        ];

        const pieData = [
            { name: 'Suất mặn', value: 280 },
            { name: 'Suất chay', value: 45 }
        ];

        res.status(200).json({
            data: {
                studentCount: totalStudents,
                mealsToday: mealsToday || 120, // Dự phòng 120 nếu database rỗng
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
        console.error("Lỗi getAdminStats:", error);
        res.status(500).json({ message: 'Lỗi thống kê' });
    }
};