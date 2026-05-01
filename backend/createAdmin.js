const bcrypt = require('bcrypt'); // Thêm dòng này
const { User } = require('./src/models'); 

async function createAdmin() {
  try {
    await User.sync({ alter: true });

    // Mã hóa mật khẩu trước khi lưu vào DB
    const hashedPassword = await bcrypt.hash('maittx1', 10);

    const admin = await User.create({
      Username: 'maittx1',
      FullName: 'Trần Thị Xuân Mai',
      Phone: '0905000002',
      PasswordHash: hashedPassword, // Lưu mật khẩu đã mã hóa
      Role: 'Admin',
      Status: 'Active'
    });

    console.log('✅ ĐÃ TẠO ADMIN THÀNH CÔNG!');
    process.exit();
  } catch (error) {
    console.error('❌ LỖI:', error.message);
    process.exit(1);
  }
}
createAdmin();