const fs = require('fs');
const path = require('path');

const directoryPath = __dirname;
const files = fs.readdirSync(directoryPath).filter(file => file.endsWith('.html'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(directoryPath, file), 'utf8');
    let original = content;

    // Remove Ueber Uns from lists (like Footer)
    content = content.replace(/<li[^>]*>\s*<a[^>]*href=["'](?:[\.\/]+)?ueber-uns\.html["'][^>]*>[\s\S]*?<\/a>\s*<\/li>\s*/gi, '');
    
    // Remove Ueber Uns from direct links (like Header nav-links)
    content = content.replace(/<a[^>]*href=["'](?:[\.\/]+)?ueber-uns\.html["'][^>]*>[\s\S]*?<\/a>\s*/gi, '');

    // Product page: Bestseller is missing
    if (file === 'product.html' || file === 'suche.html' || file === 'kontakt.html' || file === 'account.html') {
        // If it doesn't have a Bestseller link, add it after Kollektion
        if (!content.match(/<a[^>]*>Bestseller<\/a>/gi)) {
            content = content.replace(/(<a[^>]*href=["']suche(?:.html)?["'][^>]*>Kollektion<\/a>\s*)/gi, `$1<a href="index.html#bestseller">Bestseller</a>\n                  `);
            // There might be multiple nav menus (desktop/mobile layout) so /g flag in replace is needed ?
            // Let's use string replace all safely. No, it replaces only first if no /g, let's use /g
            let re = /(<a[^>]*href=["']suche(?:.html)?["'][^>]*>Kollektion<\/a>\s*)/gi;
            content = content.replace(re, `$1<a href="index.html#bestseller">Bestseller</a>\n                  `);
        }
    }

    if (content !== original) {
        fs.writeFileSync(path.join(directoryPath, file), content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
