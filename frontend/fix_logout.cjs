const fs = require('fs');
const files = [
  './src/pages/parent-portal/Dashboard.jsx',
  './src/pages/parent-portal/MealSchedule.jsx',
  './src/pages/parent-portal/MealRegistration.jsx'
];
files.forEach(f => {
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, 'utf8');
    const newContent = content.replace(/<button onClick=\{handleLogout\}[^>]*><\/button>/g, '<button onClick={handleLogout} className="text-xs font-bold text-red-600 px-3 py-1 bg-red-50 rounded border border-red-100 hover:bg-red-100 transition-colors">Đăng xuất</button>');
    if (content !== newContent) {
        fs.writeFileSync(f, newContent, 'utf8');
        console.log('Fixed ' + f);
    }
  }
});
