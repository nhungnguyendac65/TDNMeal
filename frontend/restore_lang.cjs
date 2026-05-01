const fs = require('fs');

const files = [
    './src/pages/kitchen-portal/DailyMenuCreator.jsx',
    './src/pages/kitchen-portal/DishManagement.jsx',
    './src/pages/kitchen-portal/IngredientManagement.jsx',
    './src/pages/kitchen-portal/WeeklyMenu.jsx'
];

const langBtn = `
            <button onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')} className="flex items-center space-x-1.5 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-bold border border-gray-200 hover:bg-gray-200 transition-colors shadow-sm">
              <span>{lang === 'vi' ? 'VN' : 'EN'}</span>
            </button>
            <div className="relative group cursor-pointer pb-2 -mb-2 z-[100] ml-2">
`;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (!content.includes('setLang(lang')) {
        content = content.replace('<div className="relative group cursor-pointer pb-2 -mb-2 z-[100] ml-2">', langBtn);
        fs.writeFileSync(f, content, 'utf8');
        console.log('Restored lang toggle in ' + f);
    }
});
