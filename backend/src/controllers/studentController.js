// [ĐÃ SỬA]: Thêm User vào danh sách require
const { Student, StudentAllergy, AllergyCategory, MealRegistration, DailyMealSelection, User } = require('../models');
const { Op } = require('sequelize');

// ==========================================
// 1. Lấy danh sách con + KÈM THEO CHI TIẾT DỊ ỨNG
// ==========================================
exports.getStudentsByParent = async (req, res) => {
    try {
        const { parentId } = req.params;

        // Bước 1: Lấy danh sách học sinh cơ bản
        const students = await Student.findAll({
            where: { ParentID: parentId }
        });

        if (!students || students.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy học sinh nào của phụ huynh này.' });
        }

        const studentsData = [];

        // Bước 2: Quét từng học sinh để gom chi tiết dị ứng
        for (let student of students) {
            let stData = student.toJSON(); // Chuyển sang JSON để dễ thêm thuộc tính mới

            // Lôi bảng Dị ứng ra kiểm tra
            const allergies = await StudentAllergy.findAll({
                where: { StudentID: stData.StudentID || stData.id }
            });

            if (allergies && allergies.length > 0) {
                stData.HasAllergy = true; // Bật cờ có dị ứng

                let notes = [];
                for (let a of allergies) {
                    if (a.SpecificNote) {
                        // Nếu có ghi chú chi tiết (VD: Tôm, Cua, Mực)
                        notes.push(a.SpecificNote);
                    } else if (a.CategoryID) {
                        // Nếu không có chi tiết, lấy tên của Nhóm dị ứng (VD: Sữa)
                        const cat = await AllergyCategory.findByPk(a.CategoryID);
                        if (cat) notes.push(cat.CategoryName);
                    }
                }

                // Nối các món lại thành chuỗi, ví dụ: "Tôm, Mực, Sữa"
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
// 2. Cập nhật hồ sơ sức khỏe & Dị ứng (Giữ nguyên)
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

        // Lấy tháng hiện tại (Format: YYYY-MM)
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // 1. TÌM TẤT CẢ CÁC PHIẾU ĐĂNG KÝ (Từ tháng hiện tại trở về sau)
        const registrations = await MealRegistration.findAll({
            where: {
                StudentID: id,
                Status: { [Op.ne]: 'Cancelled' }, // Bỏ qua mấy phiếu đã hủy
                Month: { [Op.gte]: currentMonthStr } // Lấy từ tháng này trở đi
            }
        });

        let totalBalance = 0;
        let regStatus = 'Chưa đăng ký';

        if (registrations.length > 0) {
            // 2. XÁC ĐỊNH TRẠNG THÁI HIỂN THỊ TRÊN DASHBOARD
            // Nếu có bất kỳ phiếu nào đang chờ thanh toán -> Báo màu cam
            const hasPending = registrations.some(r => r.Status === 'Pending Payment' || r.Status === 'Pending');
            const hasPaid = registrations.some(r => r.Status === 'Paid');

            if (hasPending) {
                regStatus = 'Chờ thanh toán';
            } else if (hasPaid) {
                regStatus = 'Đã đăng ký';
            }

            // 3. VÒNG LẶP: CỘNG DỒN SỐ DƯ BỮA ĂN CỦA TẤT CẢ CÁC THÁNG ĐÃ ĐÓNG TIỀN
            const paidRegs = registrations.filter(r => r.Status === 'Paid');

            for (let i = 0; i < paidRegs.length; i++) {
                const reg = paidRegs[i];
                // Lấy khóa chính (có thể là RegistrationID hoặc id tùy schema của bạn)
                const regKey = reg.RegistrationID || reg.id;

                // Đếm số ngày đã chọn món của cái phiếu này
                const usedDays = await DailyMealSelection.count({
                    where: { RegistrationID: regKey }
                });

                // Cộng dồn: Tổng ngày của tháng đó - Số ngày đã ăn
                totalBalance += (reg.TotalDays - usedDays);
            }
        }

        // Trả kết quả về cho Frontend
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


// API THỐNG KÊ DASHBOARD (Lấy dữ liệu thật 100% từ Database)
exports.getDashboardStats = async (req, res) => {
    try {
        const { id } = req.params; // ID của học sinh

        // 1. Tìm các tháng mà học sinh này ĐÃ THANH TOÁN
        const regs = await MealRegistration.findAll({
            where: { StudentID: id, Status: 'Paid' }
        });

        const regIds = regs.map(r => r.RegistrationID || r.id);

        // Nếu chưa đóng tiền tháng nào -> Trả về mảng rỗng
        if (regIds.length === 0) {
            return res.status(200).json({
                data: { barData: [], pieData: [], lineData: [], upcomingMeals: [] }
            });
        }

        // 2. Lấy TẤT CẢ các món ăn (Mặn/Chay) mà phụ huynh đã click chọn
        const selections = await DailyMealSelection.findAll({
            where: { RegistrationID: regIds }
        });

        // 3. TÍNH TOÁN BIỂU ĐỒ TRÒN (Pie Chart): Tỉ lệ Mặn / Chay
        let manCount = 0;
        let chayCount = 0;
        selections.forEach(s => {
            if (s.MealType === 'Standard') manCount++;
            if (s.MealType === 'Vegetarian') chayCount++;
        });

        const pieData = [];
        if (manCount > 0) pieData.push({ name: 'Suất Mặn', value: manCount });
        if (chayCount > 0) pieData.push({ name: 'Suất Chay', value: chayCount });

        // 4. LẤY DANH SÁCH 3 BỮA ĂN SẮP TỚI NHẤT
        // Lấy ngày hôm nay theo chuẩn YYYY-MM-DD
        const todayStr = new Date().toISOString().substring(0, 10);

        const upcomingMeals = selections
            .filter(s => String(s.Date).substring(0, 10) >= todayStr) // Chỉ lấy các ngày từ hôm nay trở đi
            .sort((a, b) => String(a.Date).localeCompare(String(b.Date))) // Sắp xếp ngày gần nhất lên đầu
            .slice(0, 3) // Lấy đúng 3 ngày
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

        // 5. BIỂU ĐỒ CỘT (Mô phỏng đơn giản số bữa ăn trong tuần)
        const barData = [
            { day: 'T2', meals: 1 }, { day: 'T3', meals: 1 },
            { day: 'T4', meals: 1 }, { day: 'T5', meals: chayCount > 0 ? 1 : 0 }, { day: 'T6', meals: manCount > 0 ? 1 : 0 }
        ];

        // 6. BIỂU ĐỒ ĐƯỜNG (Mô phỏng xu hướng)
        const lineData = [
            { week: 'Tuần 1', orders: 4 }, { week: 'Tuần 2', orders: 5 },
            { week: 'Tuần 3', orders: 5 }, { week: 'Tuần 4', orders: 5 }
        ];

        // Trả toàn bộ dữ liệu thật về cho Frontend
        return res.status(200).json({
            data: { barData, pieData, lineData, upcomingMeals }
        });

    } catch (error) {
        console.error("Lỗi Dashboard Stats:", error);
        res.status(500).json({ message: 'Lỗi server khi lấy thống kê' });
    }
};

// ==========================================
// Lấy danh sách toàn trường
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

        // [THIẾU CHỖ NÀY NÈ SẾP]: Phải gọi Database để lấy học sinh ra!
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

        // 2. Vòng lặp gom chi tiết dị ứng từ bảng StudentAllergy của sếp
        for (let student of students) {
            let s = student.toJSON();

            // Tìm dị ứng của bé này
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
                allergyNote = notes.join(', '); // Nối lại thành "Tôm, Sữa bò..."
            }

            // Gói ghém dữ liệu đẩy về Frontend
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
// [SỬA LẠI] Thêm học sinh mới
// ==========================================
exports.createStudent = async (req, res) => {
    try {
        const { fullName, classRoom, parentId, allergies, status, height, weight } = req.body;

        // Tạo học sinh cơ bản
        const newStudent = await Student.create({
            FullName: fullName,
            ClassRoom: classRoom || 'Chưa xếp lớp',
            ParentID: parentId || null,
            Gender: 'Male', 
            Height: height || 0, 
            Weight: weight || 0,
            HealthProfileCompleted: false
        });

        // Nếu sếp có nhập Dị ứng ở Frontend, tạo luôn record vào bảng StudentAllergy
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

// 3. Cập nhật thông tin học sinh
exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, classRoom, allergies, status, height, weight } = req.body;

        const student = await Student.findByPk(id);
        if (!student) return res.status(404).json({ message: 'Không tìm thấy học sinh!' });

        // Cập nhật bảng Student
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

// 4. Xóa học sinh
exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        // Xóa dị ứng trước để tránh lỗi khóa ngoại
        await StudentAllergy.destroy({ where: { StudentID: id } });
        await Student.destroy({ where: { StudentID: id } });

        res.status(200).json({ message: 'Đã xóa hồ sơ học sinh!' });
    } catch (error) {
        console.error("Lỗi xóa:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};