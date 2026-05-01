const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx')) { 
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src/pages');

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // Skip if already contains ProfileModal
    if (content.includes('ProfileModal')) return;

    // Check if it has a logout button
    if (content.includes('Đăng xuất')) {
        let changed = false;

        // 1. Add import
        // Determine path to components based on directory depth
        const depth = f.split(/\\|\//).length - 3; // e.g. src/pages/admin-portal/AdminDashboard.jsx -> depth 2
        const relativePath = depth === 2 ? '../../components/ProfileModal' : '../components/ProfileModal';
        
        content = content.replace(/import React(.*?) from 'react';/, `import React$1 from 'react';\nimport ProfileModal from '${relativePath}';`);

        // 2. Add state
        // Find the main component function. e.g. export default function AdminDashboard() {
        const functionRegex = /export default function ([A-Za-z0-9_]+)\([^)]*\)\s*\{/;
        if (content.match(functionRegex)) {
            content = content.replace(functionRegex, `$&
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
`);
        }

        // 3. Add Hồ sơ button before Đăng xuất
        // We look for the button containing "Đăng xuất" and add "Hồ sơ" before it.
        const logoutBtnRegex = /(<button[^>]*>[\s\S]*?Đăng xuất[\s\S]*?<\/button>)/;
        if (content.match(logoutBtnRegex)) {
            content = content.replace(logoutBtnRegex, `<button onClick={() => setIsProfileModalOpen(true)} className="flex items-center space-x-1.5 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded text-xs font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors mr-2"><span className="hidden sm:block">Hồ sơ</span></button>
            $1`);
        }

        // 4. Render the modal inside the main container, usually right before the last closing div
        const lastDivRegex = /(<\/div>\s*)$/;
        content = content.replace(lastDivRegex, `  <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />\n$1`);

        // 5. Add event listener to update user if possible
        // We'll skip complex state updates and let them just see it when they refresh, or update the text manually
        // since some use `currentUser`, some use `JSON.parse(localStorage)`.

        if (content !== fs.readFileSync(f, 'utf8')) {
            fs.writeFileSync(f, content, 'utf8');
            console.log('Injected ProfileModal into ' + f);
        }
    }
});
