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
    const importMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
    
    let isMissing = false;
    if (importMatch) {
        const importsStr = importMatch[1];
        // Split by comma and trim to get actual tokens
        const tokens = importsStr.split(',').map(s => s.trim());
        if (!tokens.includes('User')) {
            isMissing = true;
        }
    } else {
        isMissing = true;
    }

    if (isMissing && content.includes('<User size={16} />')) {
        console.log('MISSING USER IMPORT: ' + f);
        // Fix it!
        if (importMatch) {
            content = content.replace(importMatch[0], importMatch[0].replace('}', ', User }'));
            fs.writeFileSync(f, content, 'utf8');
            console.log('Fixed User import for ' + f);
        }
    }
});
