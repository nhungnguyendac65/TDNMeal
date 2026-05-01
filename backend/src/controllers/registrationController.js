const { MealRegistration, Student } = require('../models');
const { Op } = require('sequelize');
const payos = require('../config/payos');

const MEAL_PRICE = 35000;

const getSchoolDays = (year, month) => {
    let days = 0;
    const date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
        if (date.getDay() !== 0 && date.getDay() !== 6) days++; 
        date.setDate(date.getDate() + 1);
    }
    return days;
};

// 1. API Lấy thông tin & Trạng thái phiếu
exports.getRegistrationContext = async (req, res) => {
    try {
        const { studentId, month } = req.query; 
        if (!studentId || !month) return res.status(400).json({ message: 'Thiếu thông tin' });

        const [yearStr, monthStr] = month.split('-');
        const targetYear = parseInt(yearStr);
        const targetMonth = parseInt(monthStr);

        const today = new Date();
        const deadline = new Date(targetYear, targetMonth - 2, 25, 23, 59, 59);
        const isLocked = today > deadline;

        const totalDays = getSchoolDays(targetYear, targetMonth);
        const totalPrice = totalDays * MEAL_PRICE;

        const existing = await MealRegistration.findOne({
            where: { StudentID: studentId, Month: month, Status: { [Op.ne]: 'Cancelled' } }
        });

        const student = await Student.findByPk(studentId);
        if (!student) return res.status(404).json({ message: 'Không tìm thấy học sinh' });

        return res.status(200).json({
            isLocked,
            deadline: deadline.toLocaleDateString('vi-VN') + ' 23:59',
            isRegistered: !!existing,
            registrationStatus: existing ? existing.Status : null,
            paymentMethod: existing ? existing.PaymentMethod : null,
            checkoutUrl: existing ? existing.PayOSCheckoutUrl : null, // Trả về link thanh toán nếu có
            totalDays,
            totalPrice,
            hasAllergy: student.HasAllergy || false,
            allergyNote: student.AllergyNote || ''
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi hệ thống.' });
    }
};

// 2. API Tạo phiếu đăng ký (Mặc định Pending)
exports.createRegistration = async (req, res) => {
    try {
        const { StudentID, Month, PaymentMethod } = req.body;

        const existing = await MealRegistration.findOne({
            where: { StudentID, Month, Status: { [Op.ne]: 'Cancelled' } }
        });
        
        if (existing) return res.status(400).json({ message: 'Học sinh đã được đăng ký tháng này.' });

        const [year, monthStr] = Month.split('-');
        const totalDays = getSchoolDays(parseInt(year), parseInt(monthStr));
        const totalPrice = totalDays * MEAL_PRICE;

        let payosLink = null;
        let orderCode = null;

        // NẾU LÀ CHUYỂN KHOẢN -> TẠO LINK PAYOS
        if (PaymentMethod === 'Transfer') {
            // PayOS orderCode phải là số nguyên tối đa 10 chữ số
            orderCode = Number(String(Date.now()).slice(-9)); 
            
            const student = await Student.findByPk(StudentID);
            
            // PayOS chỉ chấp nhận mô tả KHÔNG DẤU, không ký tự đặc biệt
            const removeAccents = (str) => {
                return str.normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/đ/g, 'd').replace(/Đ/g, 'D')
                          .replace(/[^a-zA-Z0-9 ]/g, '');
            };

            const cleanName = removeAccents(student.FullName || 'Student').slice(0, 15);
            const description = `Meal ${Month.replace('-','')} ${cleanName}`;

            const paymentBody = {
                orderCode: orderCode,
                amount: totalPrice,
                description: description,
                returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/parent/registrations`,
                cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/parent/registrations`,
            };

            console.log('[PayOS] Đang tạo link thanh toán:', paymentBody);
            
            try {
                const linkData = await payos.createPaymentLink(paymentBody);
                payosLink = linkData.checkoutUrl;
            } catch (payosErr) {
                console.error('[PayOS] Lỗi tạo link:', payosErr.message, payosErr.data);
                throw new Error(`PayOS Error: ${payosErr.message}`);
            }
        }
        
        const newReg = await MealRegistration.create({
            StudentID,
            Month,
            TotalDays: totalDays,
            TotalPrice: totalPrice,
            PaymentMethod,
            Status: 'Pending Payment',
            PayOSOrderCode: orderCode,
            PayOSCheckoutUrl: payosLink
        });

        return res.status(201).json({ 
            message: 'Đăng ký thành công.', 
            data: newReg,
            checkoutUrl: payosLink // Trả về cho Frontend redirect
        });
    } catch (error) {
        console.error('Lỗi PayOS/DB:', error);
        res.status(500).json({ 
            message: error.message || 'Lỗi khởi tạo đăng ký và thanh toán.',
            details: error.data || null
        });
    }
};

// 3. API Webhook nhận thông báo từ PayOS
exports.handlePayOSWebhook = async (req, res) => {
    try {
        const { data, code } = req.body;
        
        // Code 00 là thành công
        if (code === "00" && data) {
            const orderCode = data.orderCode;
            
            // Tìm phiếu đăng ký có orderCode này
            const reg = await MealRegistration.findOne({ where: { PayOSOrderCode: orderCode } });
            if (reg) {
                await reg.update({ Status: 'Paid' });
                console.log(`[PayOS] Đã xác nhận thanh toán cho OrderCode: ${orderCode}`);
            }
        }
        
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Lỗi Webhook PayOS:', error);
        res.status(500).json({ message: 'Webhook error' });
    }
};

// 4. API [DEV ONLY] - Giả lập GVCN hoặc Ngân hàng đã xác nhận nộp tiền
exports.mockApprovePayment = async (req, res) => {
    try {
        const { StudentID, Month } = req.body;
        await MealRegistration.update(
            { Status: 'Paid' },
            { where: { StudentID, Month, Status: 'Pending Payment' } }
        );
        return res.status(200).json({ message: 'Đã cập nhật thành Đã Thanh Toán (Paid)' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật.' });
    }
};

// 5. API [DEV ONLY] - Xóa sạch toàn bộ dữ liệu test
exports.clearTestData = async (req, res) => {
    try {
        const { DailyMealSelection } = require('../models'); 
        
        await DailyMealSelection.destroy({ where: {} });
        await MealRegistration.destroy({ where: {} });
        
        return res.status(200).json({ message: 'Đã dọn sạch bong dữ liệu Đăng ký và Chọn món!' });
    } catch (error) {
        console.error('Lỗi khi xóa dữ liệu:', error);
        res.status(500).json({ message: 'Lỗi dọn dẹp dữ liệu.' });
    }
};