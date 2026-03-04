const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

const correctBanner = `<div class="top-banner">
    <div class="top-banner-track">
${`        <div class="top-banner-item">
            <span class="top-banner-icon">&#9889;</span>
            SCHNELLER VERSAND: 1&ndash;3 WERKTAGE
        </div>
        <div class="top-banner-item">
            <span class="top-banner-icon">&#128230;</span>
            KOSTENLOSER VERSAND AB 60&nbsp;&euro; (DE)
        </div>
        <div class="top-banner-item">
            <span class="top-banner-icon">💧</span>
            40% DUFTÖLANTEIL
        </div>\n`.repeat(10)}    </div>
</div>`;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const start = content.indexOf('<div class="top-banner">');
    if (start === -1) continue;

    const end = content.indexOf('<nav class="navbar">');
    if (end === -1) continue;

    let commentIdx = content.indexOf('<!-- Navigation', start);
    let replacement = correctBanner + '\n\n    ';

    if (commentIdx !== -1 && commentIdx < end) {
        replacement = correctBanner + '\n    <!-- Navigation -->\n    ';
    }

    content = content.substring(0, start) + replacement + content.substring(end);
    fs.writeFileSync(file, content);
}
console.log('Fixed banners properly on all pages');
