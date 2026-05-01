const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// API: PUT /api/students/:id/health-profile
// Đi qua cửa 1 (verifyToken) -> Đi qua cửa 2 (checkRole Parent) -> Vào Controller
router.put('/:id/health-profile', verifyToken, checkRole(['Parent']), studentController.updateHealthProfile);
router.get('/parent/:parentId', studentController.getStudentsByParent);
router.get('/dashboard/:id', studentController.getStudentDashboard);
router.get('/dashboard-stats/:id', studentController.getDashboardStats);

router.get('/', verifyToken, studentController.getAllStudents);
router.post('/', verifyToken, checkRole(['Admin']), studentController.createStudent);
router.put('/:id', verifyToken, checkRole(['Admin']), studentController.updateStudent);
router.delete('/:id', verifyToken, checkRole(['Admin']), studentController.deleteStudent);
module.exports = router;

