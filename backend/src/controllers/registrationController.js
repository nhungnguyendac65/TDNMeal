const { MealRegistration, Student } = require('../models');
const { Op } = require('sequelize');
const payos = require('../config/payos');

const MEAL_PRICE = 35000;

/**
 * Calculates the total number of school days (Monday to Friday) in a given month.
 * @param {number} year - The target year.
 * @param {number} month - The target month (1-12).
 * @returns {number} Total school days.
 */
const getSchoolDays = (year, month) => {
    let days = 0;
    const date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
        if (date.getDay() !== 0 && date.getDay() !== 6) days++;
        date.setDate(date.getDate() + 1);
    }
    return days;
};

/**
 * Fetches the registration status and context for a specific student and month.
 * Handles automatic expiration of pending payments (10-minute timeout) 
 * and regenerates PayOS payment links to avoid "Order already processed" errors.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.getRegistrationContext = async (req, res) => {
    try {
        const { studentId, month } = req.query;
        if (!studentId || !month) return res.status(400).json({ message: 'Missing required information' });

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
        if (!student) return res.status(404).json({ message: 'Student not found' });

        let checkoutUrl = existing ? existing.PayOSCheckoutUrl : null;
        let remainingSeconds = 0;

        if (existing && existing.Status === 'Pending Payment' && existing.PaymentMethod === 'Transfer') {
            const now = new Date();
            const createdAt = new Date(existing.createdAt);
            const diffSeconds = Math.floor((now - createdAt) / 1000);
            const TIMEOUT_SECONDS = 10 * 60;

            if (diffSeconds > TIMEOUT_SECONDS) {
                console.log(`[Timeout] Deleting registration for student ${studentId} due to payment timeout.`);
                await existing.destroy();
                existing = null;
                checkoutUrl = null;
            } else {
                remainingSeconds = TIMEOUT_SECONDS - diffSeconds;
                try {
                    const newOrderCode = Number(String(Date.now()).slice(-9));
                    const removeAccents = (str) => {
                        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^a-zA-Z0-9 ]/g, '');
                    };
                    const cleanName = removeAccents(student.FullName || 'Student').slice(0, 15);
                    const expiredAt = Math.floor(Date.now() / 1000) + remainingSeconds;

                    const descriptionText = `Meal ${month.replace('-', '')} ${cleanName}`;
                    const paymentBody = {
                        orderCode: newOrderCode,
                        amount: totalPrice,
                        description: descriptionText.substring(0, 25),
                        returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/parent/registrations`,
                        cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/parent/registrations`,
                        expiredAt: expiredAt
                    };

                    const linkData = await payos.paymentRequests.create(paymentBody);

                    await existing.update({
                        PayOSOrderCode: newOrderCode,
                        PayOSCheckoutUrl: linkData.checkoutUrl
                    });

                    checkoutUrl = linkData.checkoutUrl;
                } catch (err) {
                    console.error('[PayOS Refresh] Failed to regenerate link:', err.message);
                    // We don't throw here to allow the rest of the context to be returned
                }
            }
        }

        return res.status(200).json({
            isLocked,
            deadline: deadline.toLocaleDateString('en-GB') + ' 23:59',
            isRegistered: !!existing,
            registrationStatus: existing ? existing.Status : null,
            paymentMethod: existing ? existing.PaymentMethod : null,
            checkoutUrl: checkoutUrl,
            remainingSeconds,
            totalDays,
            totalPrice,
            hasAllergy: student.HasAllergy || false,
            allergyNote: student.AllergyNote || ''
        });
    } catch (error) {
        console.error('[getRegistrationContext Critical Error]', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

/**
 * Creates a new meal registration for a student.
 * If the payment method is 'Transfer', it initiates a PayOS payment request.
 * @param {Object} req - Express request object containing StudentID, Month, and PaymentMethod.
 * @param {Object} res - Express response object.
 */
exports.createRegistration = async (req, res) => {
    try {
        const { StudentID, Month, PaymentMethod } = req.body;

        const existing = await MealRegistration.findOne({
            where: { StudentID, Month, Status: { [Op.ne]: 'Cancelled' } }
        });

        if (existing) return res.status(400).json({ message: 'Student already registered for this month.' });

        const [year, monthStr] = Month.split('-');
        const totalDays = getSchoolDays(parseInt(year), parseInt(monthStr));
        const totalPrice = totalDays * MEAL_PRICE;

        let payosLink = null;
        let orderCode = null;

        if (PaymentMethod === 'Transfer') {
            orderCode = Number(String(Date.now()).slice(-9));

            const student = await Student.findByPk(StudentID);

            const removeAccents = (str) => {
                return str.normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
                    .replace(/[^a-zA-Z0-9 ]/g, '');
            };

            const cleanName = removeAccents(student.FullName || 'Student');
            const descriptionText = `Meal ${Month.replace('-', '')} ${cleanName}`;
            const description = descriptionText.substring(0, 25);

            const expiredAt = Math.floor(Date.now() / 1000) + (10 * 60);

            const paymentBody = {
                orderCode: orderCode,
                amount: totalPrice,
                description: description,
                returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/parent/registrations`,
                cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/parent/registrations`,
                expiredAt: expiredAt
            };

            console.log('[PayOS] Generating payment link:', paymentBody);

            try {
                const linkData = await payos.paymentRequests.create(paymentBody);
                payosLink = linkData.checkoutUrl;
            } catch (payosErr) {
                console.error('[PayOS] Creation error:', payosErr.message, payosErr.data);
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
            message: 'Registration successful.',
            data: newReg,
            checkoutUrl: payosLink
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: error.message || 'Server error during registration.',
            details: error.data || null
        });
    }
};

/**
 * Handles PayOS webhooks for payment confirmations.
 * Updates the registration status to 'Paid' upon successful transaction.
 * @param {Object} req - Express request object containing PayOS webhook data.
 * @param {Object} res - Express response object.
 */
exports.handlePayOSWebhook = async (req, res) => {
    try {
        const { data, code } = req.body;

        if (code === "00" && data) {
            const orderCode = data.orderCode;

            const reg = await MealRegistration.findOne({ where: { PayOSOrderCode: orderCode } });
            if (reg) {
                await reg.update({ Status: 'Paid' });
                console.log(`[PayOS] Payment confirmed for OrderCode: ${orderCode}`);
            }
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('PayOS Webhook error:', error);
        res.status(500).json({ message: 'Webhook error' });
    }
};

/**
 * Mocks payment approval for development purposes.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.mockApprovePayment = async (req, res) => {
    try {
        const { StudentID, Month } = req.body;
        await MealRegistration.update(
            { Status: 'Paid' },
            { where: { StudentID, Month, Status: 'Pending Payment' } }
        );
        return res.status(200).json({ message: 'Payment status updated to Paid (Mocked)' });
    } catch (error) {
        res.status(500).json({ message: 'Update error.' });
    }
};

/**
 * Clears all registration and meal selection data for testing.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.clearTestData = async (req, res) => {
    try {
        const { DailyMealSelection } = require('../models');

        await DailyMealSelection.destroy({ where: {} });
        await MealRegistration.destroy({ where: {} });

        return res.status(200).json({ message: 'All test data cleared.' });
    } catch (error) {
        console.error('Data clearing error:', error);
        res.status(500).json({ message: 'Error clearing data.' });
    }
};