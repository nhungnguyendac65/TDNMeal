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
  
  // 1. Ensure useState and useEffect are imported if needed (they usually are)
  
  // 2. Find the main component's return
  // We look for 'export default function' then the first 'return (' after it
  const exportPos = content.indexOf('export default function');
  if (exportPos === -1) return;
  
  const returnPos = content.indexOf('return (', exportPos);
  if (returnPos === -1) return;
  
  const startPos = returnPos + 8; // After 'return ('
  
  // We want to find the matching ');' for this return
  // But wait, there might be nested ); in some rare cases (like map)
  // Let's just find the last ); in the component's body.
  
  // A safer way: find the last </div> before the end of the function.
  // Actually, let's just wrap the entire return content in a fragment.
  
  // find the first '<' after return (
  const firstTagPos = content.indexOf('<', startPos);
  
  // Find the last '>' before the ');' of the return
  // We'll search backwards from the next 'export' or end of file
  let nextExport = content.indexOf('export', exportPos + 20);
  if (nextExport === -1) nextExport = content.length;
  
  const lastReturnParen = content.lastIndexOf(');', nextExport);
  if (lastReturnParen === -1) return;
  
  const lastTagPos = content.lastIndexOf('>', lastReturnParen);
  
  if (firstTagPos !== -1 && lastTagPos !== -1) {
     const modalStr = '\n      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />';
     
     content = content.slice(0, firstTagPos) + '<>' + content.slice(firstTagPos, lastTagPos + 1) + modalStr + '</>' + content.slice(lastTagPos + 1);
     
     fs.writeFileSync(fullPath, content, 'utf8');
     console.log('Fixed ' + file);
  }
});
