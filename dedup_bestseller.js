const fs = require('fs');
const path = require('path');

const directoryPath = __dirname;
const files = fs.readdirSync(directoryPath).filter(file => file.endsWith('.html'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(directoryPath, file), 'utf8');
    const original = content;

    // Replace exactly matching double blocks of Bestseller link
    const regex = /(<a[^>]*href=["'](?:.\/)?(?:index\.html)?#bestseller["'][^>]*>Bestseller<\/a>\s*){2,}/gi;

    if (regex.test(content)) {
        content = content.replace(regex, '<a href="index.html#bestseller">Bestseller</a>\n                  ');
        fs.writeFileSync(path.join(directoryPath, file), content, 'utf8');
        console.log(`Deduplicated Bestseller links in ${file}`);
    }
});
