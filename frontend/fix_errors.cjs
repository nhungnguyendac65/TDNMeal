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
const files = walk('./src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content;
    newContent = newContent.replace(/\{toast\.type === 'error' \? \s*: \}/g, "<span className=\"text-xl mr-2\">{toast.type === 'error' ? '❌' : '✅'}</span>");
    newContent = newContent.replace(/\{toast\.type === 'error' \?\s*: \}/g, "<span className=\"text-xl mr-2\">{toast.type === 'error' ? '❌' : '✅'}</span>");
    
    if (content !== newContent) {
        console.log('Fixed error in: ' + file);
        fs.writeFileSync(file, newContent, 'utf8');
    }
});
