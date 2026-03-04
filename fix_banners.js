const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const startIdx = content.indexOf('<div class="top-banner-track">');
    if (startIdx === -1) continue;

    const endIdx = content.indexOf('</div>', startIdx);
    if (endIdx === -1) continue;

    const inner = content.substring(startIdx + 30, endIdx);
    content = content.substring(0, startIdx + 30) + inner.repeat(4) + content.substring(endIdx);
    fs.writeFileSync(file, content);
}
console.log('Banners duplicated');
