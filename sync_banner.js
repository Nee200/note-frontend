const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'frauenduefte.html');
const destFile = path.join(__dirname, 'kontakt.html');

const srcContent = fs.readFileSync(srcFile, 'utf8');
let destContent = fs.readFileSync(destFile, 'utf8');

// Extract the top-banner block from frauenduefte
const bannerMatch = srcContent.match(/<div class="top-banner">[\s\S]*?<\/div>[\s\n]*<\/div>/);

if (bannerMatch && !destContent.includes('<div class="top-banner">')) {
    // Inject it into kontakt.html right after <body>
    destContent = destContent.replace(/<body[^>]*>/i, `$&
    ${bannerMatch[0]}
`);
    fs.writeFileSync(destFile, destContent, 'utf8');
    console.log('Top banner successfully injected into Kontakt page!');
} else {
    console.log('Failed to find banner or it already exists.');
}
