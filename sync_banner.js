const fs = require('fs');
const path = require('path');

const dir = __dirname;
const indexContent = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');

const bannerRegex = /<div class="top-banner">([\s\S]*?)<\/div>\s*<\/div>/;
const match = indexContent.match(bannerRegex);

if (!match) {
    console.error("Banner not found in index.html");
    process.exit(1);
}

const fullBannerHtml = `<div class="top-banner">${match[1]}</div>\n</div>`;

const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    const replacedContent = content.replace(/<div class="top-banner">[\s\S]*?<\/div>\s*<\/div>/, fullBannerHtml);
    if (content !== replacedContent) {
        fs.writeFileSync(path.join(dir, file), replacedContent);
        console.log(`Updated banner in ${file}`);
    }
});
