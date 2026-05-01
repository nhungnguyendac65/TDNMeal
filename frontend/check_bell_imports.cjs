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
        const tokens = importsStr.split(',').map(s => s.trim());
        if (!tokens.includes('Bell')) {
            isMissing = true;
        }
    } else {
        isMissing = true;
    }

    if (isMissing && content.includes('<Bell')) {
        console.log('MISSING BELL IMPORT: ' + f);
        if (importMatch) {
            content = content.replace(importMatch[0], importMatch[0].replace('}', ', Bell }'));
            fs.writeFileSync(f, content, 'utf8');
            console.log('Fixed Bell import for ' + f);
        }
    }
});
