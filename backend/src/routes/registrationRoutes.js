const express = require('express');
const router = express.Router();
const regController = require('../controllers/registrationController');
const scheduleController = require('../controllers/scheduleController');
const { verifyToken } = require('../middlewares/authMiddleware');


router.get('/context', regController.getRegistrationContext);
router.post('/', regController.createRegistration);
router.post('/payos-webhook', regController.handlePayOSWebhook);


router.get('/selections', verifyToken, scheduleController.getSelections);
router.post('/selections', verifyToken, scheduleController.saveSelection);
router.get('/weekly-menu', verifyToken, scheduleController.getWeeklyMenu);

// TODO: Mock payment test button (only for quick admin approval testing, not for production)
router.post('/mock-pay', regController.mockApprovePayment);
router.delete('/clear-test', regController.clearTestData);
module.exports = router;