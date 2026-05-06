const express = require('express');
const router = express.Router();
const regController = require('../controllers/registrationController');
const scheduleController = require('../controllers/scheduleController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/context', verifyToken, regController.getRegistrationContext); 
router.post('/', verifyToken, regController.createRegistration); 

router.get('/selections', verifyToken, scheduleController.getSelections); // [THÊM verifyToken]
router.post('/selections', verifyToken, scheduleController.saveSelection); // [THÊM verifyToken]
router.get('/weekly-menu', verifyToken, scheduleController.getWeeklyMenu); // [THÊM verifyToken]
router.get('/weekly-context', verifyToken, scheduleController.getParentWeeklyContext); // [SUPER API]
router.post('/mock-pay', regController.mockApprovePayment);
router.delete('/clear-test', regController.clearTestData);
module.exports = router;