const fs = require('fs');
const files = [
  './src/pages/admin-portal/AdminDashboard.jsx',
  './src/pages/kitchen-portal/Dashboard.jsx',
  './src/pages/parent-portal/Dashboard.jsx',
  './src/pages/admin-portal/PaymentManagement.jsx'
];
files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/<div className="bg-[a-z]+-100 p-[0-9]+ rounded(-full|-md|-lg|) text-[a-z]+-[0-9]+">[\s\S]*?<\/div>/g, '');
    fs.writeFileSync(file, content, 'utf8');
  }
});
