const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcrypt');

const { connectDB } = require('./src/config/database');
const { syncDatabase, User, Student, AllergyCategory, Supplier, Ingredient, Dish, DailyMenu } = require('./src/models');

// =====================================
// 1. IMPORT ROUTES
// =====================================
const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const kitchenRoutes = require('./src/routes/kitchenRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const registrationRoutes = require('./src/routes/registrationRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const compression = require('compression');
const path = require('path');
const app = express();

// =====================================
// 2. MIDDLEWARE & ROUTES SETUP
// =====================================
// 0. Bật nén Gzip để tăng tốc độ tải qua Ngrok/Mạng chậm
app.use(compression());

// 1. Mở cửa CORS cho Frontend truy cập
app.use(cors());

// 2. Parse JSON bodyapp.use(express.json());

// 3. Serve static image folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/menus', require('./src/routes/menuRoutes'));
app.use('/api/schedule', require('./src/routes/scheduleRoutes'));
app.use('/api/payments', require('./src/routes/paymentRoutes'));

// 5. SERVE FRONTEND (For Production)
if (process.env.NODE_ENV === 'production') {
    // Point to frontend build folder (dist)
    app.use(express.static(path.join(__dirname, '../frontend/dist')));

    // Any route that doesn't start with /api should return index.html (React routing)
    app.use((req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
        }
    });
}
// =====================================
// 3. SEEDING FUNCTIONS
// =====================================
const seedData = async () => {
    // 1. Create parent 1
    let parent = await User.findOne({ where: { Phone: '0901234567' } });
    if (!parent) {
        const hashedPassword = await bcrypt.hash('123456', 10);
        parent = await User.create({
            FullName: 'Phụ huynh Test',
            Phone: '0901234567',
            PasswordHash: hashedPassword,
            Role: 'Parent'
        });
    }

    // 2. Create student for this parent
    const checkStudent = await Student.findOne({ where: { ParentID: parent.UserID || parent.id } });
    if (!checkStudent) {
        await Student.create({
            FullName: 'Học sinh Test',
            Gender: 'Male',
            ParentID: parent.UserID || parent.id
        });
    }

    const allergyList = [
        { CategoryID: 1, CategoryName: 'Rau củ' },
        { CategoryID: 2, CategoryName: 'Hải sản' },
        { CategoryID: 3, CategoryName: 'Các loại tinh bột' },
        { CategoryID: 4, CategoryName: 'Đồ uống' },
        { CategoryID: 5, CategoryName: 'Thịt gia cầm' },
        { CategoryID: 6, CategoryName: 'Thịt đỏ' },
        { CategoryID: 7, CategoryName: 'Sữa và chế phẩm từ sữa' },
        { CategoryID: 8, CategoryName: 'Khác' }
    ];

    try {
        for (const item of allergyList) {
            await AllergyCategory.upsert(item);
        }
        console.log('Đã đồng bộ chuẩn 8 Nhóm Dị Ứng');
    } catch (err) {
        console.error('Lỗi khi tạo nhóm dị ứng:', err);
    }
};

const seedKitchenData = async () => {
    // 1. Create Kitchen account
    const checkKitchen = await User.findOne({ where: { Phone: '0988888888' } });
    if (!checkKitchen) {
        const hashPass = await bcrypt.hash('123456', 10);
        await User.create({
            FullName: 'Bếp Trưởng Test',
            Phone: '0988888888',
            PasswordHash: hashPass,
            Role: 'Kitchen'
        });
    }
    // 2. Create Supplier & Sample Ingredients (if not exists)
    const countSupplier = await Supplier.count();
    if (countSupplier === 0) {
        await Supplier.create({ SupplierName: 'Công ty Thực phẩm Sạch Đà Nẵng', CertStatus: 'VietGAP' });
        await Ingredient.bulkCreate([
            { IngredientName: 'Tôm sú', Unit: 'kg', AllergyRisk: true, CategoryID: 2 },
            { IngredientName: 'Rau cải ngọt', Unit: 'kg', AllergyRisk: false, CategoryID: 1 }
        ]);
    }
};

const seedFreshTestAccount2 = async () => {
    // Create a fresh test account for Onboarding testing
    const checkUser = await User.findOne({ where: { Phone: '0922333777' } });

    if (!checkUser) {
        const hashedPassword = await bcrypt.hash('123456', 10);

        // 1. Create Parent
        const newParent = await User.create({
            FullName: 'Nguyễn Ngọc Nữ',
            Phone: '0922333777',
            PasswordHash: hashedPassword,
            Role: 'Parent'
        });

        // 2. Create Student
        await Student.create({
            FullName: 'Phan Hồng Như',
            Gender: 'Female',
            ParentID: newParent.UserID || newParent.id
        });

        console.log('Đã tạo acc TEST ONBOARDING SỐ 3: Nguyễn Ngọc Nữ - Phan Hồng Như (0922333777 / 123456)');
    }
};

// =====================================
// 4. START SERVER
// =====================================
const PORT = process.env.PORT || 5000;
const { startCronJobs } = require('./src/services/cronService');

connectDB().then(async () => {
    await syncDatabase();

    await seedData();
    await seedKitchenData();
    await seedFreshTestAccount2(); // Call test account seeding

    // Start automatic Cron Jobs
    startCronJobs();

    app.listen(PORT, () => {
        console.log(`Server đang chạy tại http://localhost:${PORT}`);
    });
});