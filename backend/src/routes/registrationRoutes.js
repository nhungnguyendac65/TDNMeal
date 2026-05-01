const express = require('express');
const router = express.Router();
const regController = require('../controllers/registrationController');
const scheduleController = require('../controllers/scheduleController');
const { verifyToken } = require('../middlewares/authMiddleware');


router.get('/context', regController.getRegistrationContext);
router.post('/', regController.createRegistration);
router.post('/payos-webhook', regController.handlePayOSWebhook);


router.get('/selections', verifyToken, scheduleController.getSelections); // [THÊM verifyToken]
router.post('/selections', verifyToken, scheduleController.saveSelection); // [THÊM verifyToken]
router.get('/weekly-menu', verifyToken, scheduleController.getWeeklyMenu); // [THÊM verifyToken]

// TODO: nút test đoạn thanh toán giả lập (chỉ để test nhanh chức năng duyệt phiếu của admin, không dùng trong thực tế)
router.post('/mock-pay', regController.mockApprovePayment);
router.delete('/clear-test', regController.clearTestData);
module.exports = router;