const fs = require('fs');
const path = require('path');

const dir = 'C:\\Webserver\\OnlineShop\\frontend';
const newVersion = Date.now();

const files = fs.readdirSync(dir);
for (const file of files) {
    if (file.endsWith('.html')) {
        let content = fs.readFileSync(path.join(dir, file), 'utf8');
        // Update style.css?v=... to style.css?v=177...
        content = content.replace(/style\.css\?v=[0-9]+/g, `style.css?v=${newVersion}`);
        // Update script.js?v=... to script.js?v=177...
        content = content.replace(/script\.js\?v=[0-9]+/g, `script.js?v=${newVersion}`);
        // Handle no version parameter
        content = content.replace(/href="style\.css"/g, `href="style.css?v=${newVersion}"`);
        content = content.replace(/src="script\.js"/g, `src="script.js?v=${newVersion}"`);

        fs.writeFileSync(path.join(dir, file), content);
        console.log(`Updated ${file}`);
    }
}
console.log('Versions updated.');
