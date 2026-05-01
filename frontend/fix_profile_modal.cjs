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

files.forEach(file => {
  const fullPath = path.join(baseDir, file);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  // 1. Ensure Import
  if (!content.includes('import ProfileModal')) {
    content = 'import ProfileModal from \'../../components/ProfileModal\';\n' + content;
    changed = true;
  }

  // 2. Ensure State
  if (!content.includes('isProfileModalOpen')) {
    const stateMatch = content.match(/export default function.*?\s*\{/);
    if (stateMatch) {
       const insertPos = content.indexOf('{', content.indexOf(stateMatch[0])) + 1;
       content = content.slice(0, insertPos) + '\n  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);' + content.slice(insertPos);
       changed = true;
    }
  }

  // 3. Ensure Component in JSX
  if (!content.includes('<ProfileModal')) {
    const returnMatch = content.lastIndexOf(');');
    if (returnMatch !== -1) {
       content = content.slice(0, returnMatch) + 
                 '      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />\n    ' + 
                 content.slice(returnMatch);
       changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Fixed ' + file);
  }
});
