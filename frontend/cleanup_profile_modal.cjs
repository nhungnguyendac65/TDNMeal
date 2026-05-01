const fs = require('fs');
const path = require('path');

const baseDir = './src/pages';
const files = [
  'admin-portal/UserManagement.jsx',
  'admin-portal/AdminDashboard.jsx',
  'admin-portal/StudentManagement.jsx',
  'admin-portal/MenuManagement.jsx',
  'admin-portal/PaymentManagement.jsx',
  'kitchen-portal/Dashboard.jsx',
  'kitchen-portal/DishManagement.jsx',
  'kitchen-portal/DailyMenuCreator.jsx',
  'kitchen-portal/WeeklyMenu.jsx',
  'kitchen-portal/IngredientManagement.jsx',
  'parent-portal/Dashboard.jsx',
  'parent-portal/MealSchedule.jsx',
  'parent-portal/MealRegistration.jsx'
];

const wrongLine = '<ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />';

files.forEach(file => {
  const fullPath = path.join(baseDir, file);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes(wrongLine)) {
    content = content.split(wrongLine).join('');
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Cleaned ' + file);
  }
});
