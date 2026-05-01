const fs = require('fs');

const files = [
    './src/pages/kitchen-portal/DailyMenuCreator.jsx',
    './src/pages/kitchen-portal/DishManagement.jsx',
    './src/pages/kitchen-portal/IngredientManagement.jsx',
    './src/pages/kitchen-portal/WeeklyMenu.jsx',
    './src/pages/kitchen-portal/Dashboard.jsx'
];

const dropdownHTML = `
            <button
              onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
              className="flex items-center space-x-1.5 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-bold border border-gray-200 hover:bg-gray-200 transition-colors shadow-sm"
              title={lang === 'vi' ? 'Đổi ngôn ngữ' : 'Change Language'}
            >
              <span>{lang === 'vi' ? 'VN' : 'EN'}</span>
            </button>

            <div className="relative group cursor-pointer pb-2 -mb-2 z-[100] ml-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <span className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-sm transition-transform group-hover:scale-105">
                  <User size={16} />
                </span>
              </div>
              
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right translate-y-2 group-hover:translate-y-0">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-md">
                  <p className="text-[13px] font-bold text-slate-800">Tài khoản</p>
                </div>
                <div className="p-1.5">
                  <button onClick={() => setIsProfileModalOpen(true)} className="w-full text-left px-3 py-2 text-[13px] text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors font-semibold">Sửa thông tin</button>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 rounded transition-colors font-bold mt-1">{lang === 'vi' ? 'Đăng xuất' : 'Logout'}</button>
                </div>
              </div>
            </div>
`;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    if (content.includes('group-hover:scale-105') && !content.includes('setLang')) {
        content = content.replace(/<div className="relative group cursor-pointer pb-2 -mb-2 z-\[100\] ml-2">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, dropdownHTML);
        fs.writeFileSync(f, content, 'utf8');
        console.log('Restored language toggle & updated dropdown for ' + f);
    } 
    else if (content.includes('Hồ sơ')) {
        const regex = /<button onClick=\{\(\) => setIsProfileModalOpen\(true\)\}[\s\S]*?<button[\s\S]*?onClick=\{handleLogout\}[\s\S]*?<\/button>\s*<\/button>|<button onClick=\{\(\) => setIsProfileModalOpen\(true\)\}[\s\S]*?<button[\s\S]*?onClick=\{handleLogout\}[\s\S]*?<\/button>/;
        
        if (content.match(regex)) {
             content = content.replace(regex, dropdownHTML);
             
             const lucideImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/;
             const match = content.match(lucideImportRegex);
             if (match && !match[1].includes('User')) {
                 content = content.replace(lucideImportRegex, `import { ${match[1]}, User } from 'lucide-react'`);
             }
             
             fs.writeFileSync(f, content, 'utf8');
             console.log('Applied dropdown to ' + f);
        }
    }
});
