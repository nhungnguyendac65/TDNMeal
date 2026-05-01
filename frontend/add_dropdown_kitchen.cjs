const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        if (fs.statSync(file).isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx')) { 
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src/pages/kitchen-portal');

const dropdownHTML = `
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
    if (content.includes('Hồ sơ')) {
        let changed = false;
        
        const lucideImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/;
        const match = content.match(lucideImportRegex);
        if (match && !match[1].includes('User')) {
            content = content.replace(lucideImportRegex, `import { ${match[1]}, User } from 'lucide-react'`);
        }

        const buttonsRegex = /<button onClick=\{\(\) => setIsProfileModalOpen\(true\)\}[\s\S]*?<button onClick=\{handleLogout\}[\s\S]*?<\/button>/;
        
        if (content.match(buttonsRegex)) {
            content = content.replace(buttonsRegex, dropdownHTML);
            changed = true;
        }

        if (changed) {
            fs.writeFileSync(f, content, 'utf8');
            console.log('Fixed ' + f);
        }
    }
});
