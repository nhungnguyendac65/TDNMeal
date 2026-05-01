const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcrypt');

const { connectDB } = require('./src/config/database');
const { syncDatabase, User, Student, AllergyCategory, Supplier, Ingredient, Dish, DailyMenu } = require('./src/models');

// =====================================
// 1. IMPORT CÁC ROUTES
// =====================================
const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const kitchenRoutes = require('./src/routes/kitchenRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const registrationRoutes = require('./src/routes/registrationRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const path = require('path');
const app = express();

// =====================================
// 2. KHAI BÁO SỬ DỤNG ROUTES 
// =====================================
// 1. Mở cửa CORS cho Frontend truy cập
app.use(cors());

// 2. Dịch dữ liệu JSON 
app.use(express.json());

// 3. Mở khóa thư mục chứa hình ảnh
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. Các đường dẫn API
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/menus', require('./src/routes/menuRoutes'));
app.use('/api/schedule', require('./src/routes/scheduleRoutes'));
app.use('/api/payments', require('./src/routes/paymentRoutes'));

// 5. PHỤC VỤ FRONTEND (Dành cho Production)
if (process.env.NODE_ENV === 'production') {
    // Trỏ đến thư mục build của frontend (giả sử bạn copy thư mục dist của Vite vào đây)
    app.use(express.static(path.join(__dirname, '../frontend/dist')));

    // Bất kỳ route nào không phải API thì trả về file index.html của React
    app.get('/:path*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
        }
    });
}
// =====================================
// 3. CÁC HÀM TẠO DỮ LIỆU MẪU (SEEDING)
// =====================================
const seedData = async () => {
    // 1. Tạo phụ huynh 1
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

    // 2. Tạo học sinh con của phụ huynh này
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
    // 1. Tạo tài khoản Bếp
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
    // 2. Tạo Nhà cung cấp & Nguyên liệu mẫu (nếu chưa có)
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
    // Tạo thêm 1 tài khoản mới tinh nữa để test Onboarding
    const checkUser = await User.findOne({ where: { Phone: '0922333777' } });

    if (!checkUser) {
        const hashedPassword = await bcrypt.hash('123456', 10);

        // 1. Tạo Phụ huynh
        const newParent = await User.create({
            FullName: 'Nguyễn Ngọc Nữ',
            Phone: '0922333777',
            PasswordHash: hashedPassword,
            Role: 'Parent'
        });

        // 2. Tạo Học sinh
        await Student.create({
            FullName: 'Phan Hồng Như',
            Gender: 'Female',
            ParentID: newParent.UserID || newParent.id
        });

        console.log('Đã tạo acc TEST ONBOARDING SỐ 3: Nguyễn Ngọc Nữ - Phan Hồng Như (0922333777 / 123456)');
    }
};

// =====================================
// 4. KHỞI ĐỘNG SERVER
// =====================================
const PORT = process.env.PORT || 5000;
const { startCronJobs } = require('./src/services/cronService');

connectDB().then(async () => {
    await syncDatabase();

    await seedData();
    await seedKitchenData();
    await seedFreshTestAccount2(); // Gọi hàm tạo nick test

    // Khởi chạy các Cron Job tự động
    startCronJobs();

    app.listen(PORT, () => {
        console.log(`Server đang chạy tại http://localhost:${PORT}`);
    });
});