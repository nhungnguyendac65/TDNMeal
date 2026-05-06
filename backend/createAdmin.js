const bcrypt = require('bcrypt'); // Required for password hashing
const { User } = require('./src/models'); 

async function createAdmin() {
  try {
    await User.sync({ alter: true });

    // Hash password before saving to DB
    const hashedPassword = await bcrypt.hash('maittx1', 10);

    const admin = await User.create({
      Username: 'maittx1',
      FullName: 'Trần Thị Xuân Mai',
      Phone: '0905000002',
      PasswordHash: hashedPassword, // Store hashed password
      Role: 'Admin',
      Status: 'Active'
    });

    console.log('✅ ADMIN CREATED SUCCESSFULLY!');
    process.exit();
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}
createAdmin();