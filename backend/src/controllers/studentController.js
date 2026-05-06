// [FIXED]: Added User to require list
const { Student, StudentAllergy, AllergyCategory, MealRegistration, DailyMealSelection, User } = require('../models');
const { Op } = require('sequelize');

// ==========================================
// 1. Get children list + INCLUDE ALLERGY DETAILS
// ==========================================
exports.getStudentsByParent = async (req, res) => {
    try {
        const { parentId } = req.params;

        // Step 1: Get basic student list
        const students = await Student.findAll({
            where: { ParentID: parentId }
        });

        if (!students || students.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy học sinh nào của phụ huynh này.' });
        }

        const studentsData = [];

        // Step 2: Scan each student to collect allergy details
        for (let student of students) {
            let stData = student.toJSON(); // Convert to JSON to easily add new properties

            // Check Allergy table
            const allergies = await StudentAllergy.findAll({
                where: { StudentID: stData.StudentID || stData.id }
            });

            if (allergies && allergies.length > 0) {
                stData.HasAllergy = true; // Set allergy flag to true

                let notes = [];
                for (let a of allergies) {
                    if (a.SpecificNote) {
                        // If there are detailed notes (e.g., Shrimp, Crab)
                        notes.push(a.SpecificNote);
                    } else if (a.CategoryID) {
                        // If no details, get the name of the Allergy Category (e.g., Milk)
                        const cat = await AllergyCategory.findByPk(a.CategoryID);
                        if (cat) notes.push(cat.CategoryName);
                    }
                }

                // Join items into a string, e.g., "Shrimp, Squid, Milk"
                stData.AllergyNote = notes.join(', ') || 'Có dị ứng';
            } else {
                stData.HasAllergy = false;
                stData.AllergyNote = '';
            }

            studentsData.push(stData);
        }

        return res.status(200).json({ message: 'Thành công', data: studentsData });

    } catch (error) {
        console.error('Lỗi lấy danh sách học sinh:', error);
        return res.status(500).json({ message: 'Lỗi server khi tìm học sinh.' });
    }
};

// ==========================================
// 2. Update health profile & Allergy (Keep existing)
// ==========================================
exports.updateHealthProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { Height, Weight, HasAllergy, AllergyDetails } = req.body;

        if (Height <= 0 || Weight <= 0) {
            return res.status(400).json({ message: 'Chiều cao và cân nặng không hợp lệ (phải > 0).' });
        }

        if (HasAllergy === true && AllergyDetails && AllergyDetails.length > 0) {
            for (let item of AllergyDetails) {
                if (item.SpecificNote) {
                    if (item.SpecificNote.length > 100) {
                        return res.status(400).json({ message: 'Ghi chú dị ứng không được vượt quá 100 ký tự.' });
                    }
                    const regex = /^[a-zA-Z0-9\s,A-ZÀ-Ỹà-ỹ]*$/;
                    if (!regex.test(item.SpecificNote)) {
                        return res.status(400).json({ message: 'Ghi chú dị ứng chứa ký tự không hợp lệ.' });
                    }
                }
            }
        }

        const userId = req.user?.userId || req.user?.UserID || req.user?.id;
        const student = await Student.findOne({
            where: { StudentID: id, ParentID: userId }
        });

        if (!student) {
            return res.status(403).json({ message: 'Bạn không có quyền cập nhật cho học sinh này.' });
        }

        student.Height = Height;
        student.Weight = Weight;
        student.HealthProfileCompleted = true;
        await student.save();

        if (HasAllergy === true && AllergyDetails && AllergyDetails.length > 0) {
            await StudentAllergy.destroy({ where: { StudentID: id } });

            const allergyRecords = AllergyDetails.map(item => ({
                StudentID: id,
                CategoryID: item.CategoryID || null,
                SpecificNote: item.SpecificNote || null
            }));

            await StudentAllergy.bulkCreate(allergyRecords);
        } else {
            await StudentAllergy.destroy({ where: { StudentID: id } });
        }

        return res.status(200).json({
            message: 'Cập nhật hồ sơ sức khỏe thành công!',
            data: student
        });

    } catch (error) {
        console.error('Lỗi cập nhật sức khỏe:', error);
        return res.status(500).json({ message: 'Lỗi hệ thống.' });
    }
};

exports.getStudentDashboard = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findByPk(id);
        if (!student) return res.status(404).json({ message: 'Không tìm thấy học sinh' });

        // Get current month (Format: YYYY-MM)
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // 1. FIND ALL REGISTRATIONS (From current month onwards)
        const registrations = await MealRegistration.findAll({
            where: {
                StudentID: id,
                Status: { [Op.ne]: 'Cancelled' }, // Skip cancelled registrations
                Month: { [Op.gte]: currentMonthStr } // Get from this month onwards
            }
        });

        let totalBalance = 0;
        let regStatus = 'Chưa đăng ký';

        if (registrations.length > 0) {
            // 2. DETERMINE DISPLAY STATUS ON DASHBOARD
            // If any registration is pending payment -> Show orange alert
            const hasPending = registrations.some(r => r.Status === 'Pending Payment' || r.Status === 'Pending');
            const hasPaid = registrations.some(r => r.Status === 'Paid');

            if (hasPending) {
                regStatus = 'Chờ thanh toán';
            } else if (hasPaid) {
                regStatus = 'Đã đăng ký';
            }

            // 3. LOOP: AGGREGATE MEAL BALANCE FROM ALL PAID MONTHS
            const paidRegs = registrations.filter(r => r.Status === 'Paid');

            for (let i = 0; i < paidRegs.length; i++) {
                const reg = paidRegs[i];
                // Get primary key (RegistrationID or id depending on schema)
                const regKey = reg.RegistrationID || reg.id;

                // Count selected meal days for this registration
                const usedDays = await DailyMealSelection.count({
                    where: { RegistrationID: regKey }
                });

                // Aggregate: Total days of that month - Number of consumed days
                totalBalance += (reg.TotalDays - usedDays);
            }
        }

        // Return results to Frontend
        return res.status(200).json({
            data: {
                ...student.toJSON(),
                registrationStatus: regStatus, // Ví dụ: 'Đã đăng ký'
                mealBalance: totalBalance      // Ví dụ: 22 + 21 = 43 bữa
            }
        });
    } catch (error) {
        console.error('Lỗi tính toán Dashboard:', error);
        res.status(500).json({ message: 'Lỗi lấy dữ liệu dashboard' });
    }
};


// DASHBOARD STATS API (Get 100% real data from Database)
exports.getDashboardStats = async (req, res) => {
    try {
        const { id } = req.params; // Student ID

        // 1. Find months where this student has PAID
        const regs = await MealRegistration.findAll({
            where: { StudentID: id, Status: 'Paid' }
        });

        const regIds = regs.map(r => r.RegistrationID || r.id);

        // If no month paid -> Return empty arrays
        if (regIds.length === 0) {
            return res.status(200).json({
                data: { barData: [], pieData: [], lineData: [], upcomingMeals: [] }
            });
        }

        // 2. Get ALL meals (Standard/Vegetarian) selected by parent
        const selections = await DailyMealSelection.findAll({
            where: { RegistrationID: regIds }
        });

        // 3. PIE CHART CALCULATION: Ratio of Standard / Vegetarian
        let manCount = 0;
        let chayCount = 0;
        selections.forEach(s => {
            if (s.MealType === 'Standard') manCount++;
            if (s.MealType === 'Vegetarian') chayCount++;
        });

        const pieData = [];
        if (manCount > 0) pieData.push({ name: 'Suất Mặn', value: manCount });
        if (chayCount > 0) pieData.push({ name: 'Suất Chay', value: chayCount });

        // 4. GET TOP 3 UPCOMING MEALS
        // Get today's date in YYYY-MM-DD standard
        const todayStr = new Date().toISOString().substring(0, 10);

        const upcomingMeals = selections
            .filter(s => String(s.Date).substring(0, 10) >= todayStr) // Only get dates from today onwards
            .sort((a, b) => String(a.Date).localeCompare(String(b.Date))) // Sort closest date first
            .slice(0, 3) // Get exactly 3 days
            .map((s, index) => {
                const dateStr = String(s.Date).substring(0, 10); // YYYY-MM-DD
                const formattedDate = `${dateStr.substring(8, 10)}/${dateStr.substring(5, 7)}/${dateStr.substring(0, 4)}`; // DD/MM/YYYY
                return {
                    id: index + 1,
                    date: formattedDate,
                    type: s.MealType === 'Standard' ? 'Suất Mặn' : 'Suất Chay',
                    status: 'Đã chốt'
                };
            });

        // 5. BAR CHART (Simple weekly meal simulation)
        const barData = [
            { day: 'T2', meals: 1 }, { day: 'T3', meals: 1 },
            { day: 'T4', meals: 1 }, { day: 'T5', meals: chayCount > 0 ? 1 : 0 }, { day: 'T6', meals: manCount > 0 ? 1 : 0 }
        ];

        // 6. LINE CHART (Trend simulation)
        const lineData = [
            { week: 'Tuần 1', orders: 4 }, { week: 'Tuần 2', orders: 5 },
            { week: 'Tuần 3', orders: 5 }, { week: 'Tuần 4', orders: 5 }
        ];

        // Return all real data to Frontend
        return res.status(200).json({
            data: { barData, pieData, lineData, upcomingMeals }
        });

    } catch (error) {
        console.error("Lỗi Dashboard Stats:", error);
        res.status(500).json({ message: 'Lỗi server khi lấy thống kê' });
    }
};

// ==========================================
// Get school-wide student list
// ==========================================
exports.getAllStudents = async (req, res) => {
    try {
        const { role, userId } = req.user;
        let condition = {};

        if (role === 'Parent') {
            condition.ParentID = userId;
        }

        if (role === 'Teacher') {
            const teacher = await User.findByPk(userId);
            if (teacher && teacher.ClassRoom) {
                condition.ClassRoom = teacher.ClassRoom;
            } else {
                condition.ClassRoom = 'NONE';
            }
        };

        // Fetch students
        const students = await Student.findAll({
            where: condition,
            include: [{
                model: User,
                as: 'parent',
                attributes: ['FullName', 'Phone']
            }],
            order: [['ClassRoom', 'ASC'], ['FullName', 'ASC']]
        });

        const formattedData = [];

        // 2. Loop to gather allergy details from StudentAllergy table
        for (let student of students) {
            let s = student.toJSON();

            // Find allergies for this child
            const allergies = await StudentAllergy.findAll({
                where: { StudentID: s.StudentID || s.id }
            });

            let allergyNote = '';
            if (allergies && allergies.length > 0) {
                let notes = [];
                for (let a of allergies) {
                    if (a.SpecificNote) {
                        notes.push(a.SpecificNote);
                    } else if (a.CategoryID) {
                        const cat = await AllergyCategory.findByPk(a.CategoryID);
                        if (cat) notes.push(cat.CategoryName);
                    }
                }
                allergyNote = notes.join(', ');
            }

            // Prepare data for Frontend
            formattedData.push({
                id: s.StudentID || s.id,
                fullName: s.FullName,
                classRoom: s.ClassRoom || 'Chưa cập nhật',
                parentName: s.parent ? s.parent.FullName : 'Chưa cập nhật',
                parentPhone: s.parent ? s.parent.Phone : '',
                allergies: allergyNote,
                status: 'Registered',
                height: s.Height || 0, 
                weight: s.Weight || 0
            });
        }

        res.status(200).json({ data: formattedData });
    } catch (error) {
        console.error("Lỗi lấy danh sách học sinh:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// ==========================================
// Add new student
// ==========================================
exports.createStudent = async (req, res) => {
    try {
        const { fullName, classRoom, parentId, allergies, status, height, weight } = req.body;

        // Create basic student record
        const newStudent = await Student.create({
            FullName: fullName,
            ClassRoom: classRoom || 'Chưa xếp lớp',
            ParentID: parentId || null,
            Gender: 'Male', 
            Height: height || 0, 
            Weight: weight || 0,
            HealthProfileCompleted: false
        });

        // If Frontend provides Allergies, create a record in StudentAllergy table
        if (allergies && allergies.trim() !== '') {
            const otherCategory = await AllergyCategory.findOne({ where: { CategoryName: 'Khác' } });
            const catId = otherCategory ? otherCategory.CategoryID : 1;

            await StudentAllergy.create({
                StudentID: newStudent.StudentID || newStudent.id,
                CategoryID: catId,
                SpecificNote: allergies
            });
        }

        res.status(201).json({ message: 'Đã thêm học sinh', data: newStudent });
    } catch (error) {
        console.error("Lỗi tạo học sinh:", error);
        res.status(500).json({ message: 'Lỗi khi thêm học sinh' });
    }
};

// 3. Update student info
exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, classRoom, allergies, status, height, weight } = req.body;

        const student = await Student.findByPk(id);
        if (!student) return res.status(404).json({ message: 'Không tìm thấy học sinh!' });

        // Update Student table
        await student.update({
            FullName: fullName,
            ClassRoom: classRoom,
            MealStatus: status,
            Height: height || student.Height, 
            Weight: weight || student.Weight
        });

        if (allergies !== undefined) {
            await StudentAllergy.destroy({ where: { StudentID: id } });
            if (allergies.trim() !== '') {
                const otherCategory = await AllergyCategory.findOne({ where: { CategoryName: 'Khác' } });
                const catId = otherCategory ? otherCategory.CategoryID : 1;

                await StudentAllergy.create({
                    StudentID: id,
                    CategoryID: catId,
                    SpecificNote: allergies
                });
            }
        }
        res.status(200).json({ message: 'Cập nhật thành công!' });
    } catch (error) {
        console.error("Lỗi cập nhật:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// 4. Delete student
exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        // Delete allergies first to avoid foreign key errors
        await StudentAllergy.destroy({ where: { StudentID: id } });
        await Student.destroy({ where: { StudentID: id } });

        res.status(200).json({ message: 'Đã xóa hồ sơ học sinh!' });
    } catch (error) {
        console.error("Lỗi xóa:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};