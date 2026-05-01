const fs = require('fs');

const files = [
    './src/pages/admin-portal/AdminDashboard.jsx',
    './src/pages/admin-portal/MenuManagement.jsx',
    './src/pages/admin-portal/PaymentManagement.jsx',
    './src/pages/admin-portal/StudentManagement.jsx',
    './src/pages/admin-portal/UserManagement.jsx',
    './src/pages/parent-portal/Dashboard.jsx',
    './src/pages/kitchen-portal/DailyMenuCreator.jsx',
    './src/pages/kitchen-portal/DishManagement.jsx',
    './src/pages/kitchen-portal/IngredientManagement.jsx',
    './src/pages/kitchen-portal/WeeklyMenu.jsx',
    './src/pages/kitchen-portal/Dashboard.jsx'
];

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (!content.includes('<ProfileModal')) {
        console.log('Missing ProfileModal in ' + f);
        const lastDivRegex = /(<\/div>\s*)$/;
        content = content.replace(lastDivRegex, `  <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />\n$1`);
        fs.writeFileSync(f, content, 'utf8');
        console.log('Fixed ' + f);
    }
});
