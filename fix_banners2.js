const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

const correctItems = `
            <div class="top-banner-item">
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
            </div>
`.repeat(10); // 10 times to ensure it covers the widest screens

const correctTrackHTML = '<div class="top-banner-track">' + correctItems + '        </div>';

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const startIdx = content.indexOf('<div class="top-banner-track">');
    if (startIdx === -1) continue;

    // Find the end of the top-banner-track. It's inside <div class="top-banner">
    // So look for the end of <div class="top-banner-track"> which is before </nav> or <nav>
    const nextTag = content.indexOf('</nav>', startIdx) !== -1 ? content.indexOf('<nav', startIdx) : content.indexOf('<!-- Navigation', startIdx);

    // But honestly, we can just replace everything between <div class="top-banner-track"> and the next </div>\n    </div>
    const regex = /<div class="top-banner-track">[\s\S]*?<\/div>\s*<\/div>\s*<!--/g;

    content = content.replace(regex, correctTrackHTML + '\n    </div>\n    <!--');
    fs.writeFileSync(file, content);
}
console.log('Banners fixed and duplicated');
