const { MealRegistration, Student, User } = require('../models');

// 1. Get payment list (Admin sees all, Teacher sees their class)
exports.getAllPayments = async (req, res) => {
    try {
        const { role, userId } = req.user;
        let studentCondition = {};

        // If Teacher, find their assigned class
        if (role === 'Teacher') {
            const teacher = await User.findByPk(userId);
            if (teacher && teacher.ClassRoom) {
                studentCondition.ClassRoom = teacher.ClassRoom;
            } else {
                studentCondition.ClassRoom = 'NONE'; // No class assigned, no students visible
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
            studentName: p.Student ? p.Student.FullName : 'Unknown',
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
        console.error("Error fetching payment list:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 2. Update status (Teacher or Admin)
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; 
        const { role, userId } = req.user;

        const registration = await MealRegistration.findByPk(id, {
            include: [{ model: Student }]
        });
        
        if (!registration) return res.status(404).json({ message: 'Registration not found' });

        if (role === 'Teacher') {
            // 1. Only cash collections
            if (registration.PaymentMethod !== 'Cash') {
                return res.status(403).json({ message: 'Teachers are only allowed to collect cash.' });
            }
            // 2. Must collect before the 25th of the previous month (e.g., May registration deadline is April 25th)
            const [year, month] = registration.Month.split('-').map(Number);
            let deadlineYear = year;
            let deadlineMonth = month - 1;
            if (deadlineMonth === 0) {
                deadlineMonth = 12;
                deadlineYear -= 1;
            }
            const deadline = new Date(deadlineYear, deadlineMonth - 1, 25);
            deadline.setHours(23, 59, 59, 999); // End of day 25

            if (new Date() > deadline) {
                return res.status(403).json({ message: 'Payment collection period has expired (deadline is the 25th of the previous month).' });
            }
            // 3. Must belong to assigned class
            const teacher = await User.findByPk(userId);
            if (!teacher || teacher.ClassRoom !== registration.Student.ClassRoom) {
                return res.status(403).json({ message: 'You do not have permission to operate on this class.' });
            }
        }

        await registration.update({ Status: status });
        res.status(200).json({ message: 'Status updated successfully!' });
    } catch (error) {
        console.error("Error updating payment status:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 3. Admin confirms quantities to notify Kitchen
exports.informKitchen = async (req, res) => {
    try {
        // Logic for sending Email/Zalo ZNS to Kitchen can be added here
        res.status(200).json({ message: 'Data summarized and notification sent to Kitchen department successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error while notifying kitchen' });
    }
};