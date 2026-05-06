const express = require('express');
const router = express.Router();
const regController = require('../controllers/registrationController');
const scheduleController = require('../controllers/scheduleController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/context', verifyToken, regController.getRegistrationContext); 
router.post('/', verifyToken, regController.createRegistration); 

router.get('/selections', verifyToken, scheduleController.getSelections); 
router.post('/selections', verifyToken, scheduleController.saveSelection); 
router.get('/weekly-menu', verifyToken, scheduleController.getWeeklyMenu); 
router.get('/weekly-context', verifyToken, scheduleController.getParentWeeklyContext); 
router.post('/mock-pay', regController.mockApprovePayment);
router.delete('/clear-test', regController.clearTestData);
module.exports = router;