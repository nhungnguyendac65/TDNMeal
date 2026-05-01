const { MealRegistration, Student, User } = require('../models');

// 1. Lấy danh sách thanh toán (Admin thấy hết, Giáo viên thấy lớp mình)
exports.getAllPayments = async (req, res) => {
    try {
        const { role, userId } = req.user;
        let studentCondition = {};

        // Nếu là Giáo viên, tìm đúng lớp của giáo viên đó
        if (role === 'Teacher') {
            const teacher = await User.findByPk(userId);
            if (teacher && teacher.ClassRoom) {
                studentCondition.ClassRoom = teacher.ClassRoom;
            } else {
                studentCondition.ClassRoom = 'NONE'; // Chưa có lớp thì ko thấy ai
            }
        }

        const payments = await MealRegistration.findAll({
            include: [{
                model: Student,
                where: studentCondition,
                attributes: ['FullName', 'ClassRoom'],
                include: [{
                    model: User,
                    as: 'parent',
                    attributes: ['FullName', 'Phone']
                }]
            }],
            order: [['createdAt', 'DESC']]
        });

        const formattedData = payments.map(p => ({
            id: p.RegistrationID || p.id,
            studentName: p.Student ? p.Student.FullName : 'Không rõ',
            classRoom: p.Student ? p.Student.ClassRoom : '',
            parentName: (p.Student && p.Student.parent) ? p.Student.parent.FullName : '',
            parentPhone: (p.Student && p.Student.parent) ? p.Student.parent.Phone : '',
            month: p.Month,
            totalDays: p.TotalDays,
            totalAmount: p.TotalPrice,
            status: p.Status,
            paymentMethod: p.PaymentMethod || 'Cash',
            updatedAt: p.updatedAt
        }));

        res.status(200).json({ data: formattedData });
    } catch (error) {
        console.error("Lỗi lấy danh sách thanh toán:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// 2. Cập nhật trạng thái (Giáo viên hoặc Admin)
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; 
        const { role, userId } = req.user;

        const registration = await MealRegistration.findByPk(id, {
            include: [{ model: Student }]
        });
        
        if (!registration) return res.status(404).json({ message: 'Không tìm thấy phiếu' });

        if (role === 'Teacher') {
            // 1. Chỉ thu tiền mặt
            if (registration.PaymentMethod !== 'Cash') {
                return res.status(403).json({ message: 'Giáo viên chỉ được phép thu tiền mặt.' });
            }
            // 2. Phải thu trước ngày 25 của tháng trước đó (Ví dụ: phiếu tháng 5 thì hạn chót là 25/4)
            const [year, month] = registration.Month.split('-').map(Number);
            let deadlineYear = year;
            let deadlineMonth = month - 1;
            if (deadlineMonth === 0) {
                deadlineMonth = 12;
                deadlineYear -= 1;
            }
            const deadline = new Date(deadlineYear, deadlineMonth - 1, 25);
            deadline.setHours(23, 59, 59, 999); // Hết ngày 25

            if (new Date() > deadline) {
                return res.status(403).json({ message: 'Đã hết hạn thu tiền (hạn chót là ngày 25 của tháng trước).' });
            }
            // 3. Phải thuộc lớp chủ nhiệm
            const teacher = await User.findByPk(userId);
            if (!teacher || teacher.ClassRoom !== registration.Student.ClassRoom) {
                return res.status(403).json({ message: 'Bạn không có quyền thao tác trên lớp này.' });
            }
        }

        await registration.update({ Status: status });
        res.status(200).json({ message: 'Cập nhật trạng thái thành công!' });
    } catch (error) {
        console.error("Lỗi cập nhật trạng thái thanh toán:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// 3. Admin chốt số lượng báo Bếp
exports.informKitchen = async (req, res) => {
    try {
        // Tại đây sau này sếp có thể code thêm logic gửi Email/Zalo ZNS cho Bếp
        res.status(200).json({ message: 'Đã tổng hợp số liệu và gửi thông báo cho bộ phận Bếp thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi báo bếp' });
    }
};