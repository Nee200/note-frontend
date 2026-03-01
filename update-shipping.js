const fs = require('fs');
const glob = require('fs').readdirSync('.');

const htmlFiles = glob.filter(f => f.endsWith('.html'));
let count = 0;
for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace remaining references to 50
    content = content.replace(/Noch €50,00 bis zu kostenlosem/g, 'Noch 60,00 € bis zu kostenlosem');
    content = content.replace(/Noch 50,00( |Ã¢â€šÂ¬|€|&euro;|Â)*bis zu kostenlosem/g, 'Noch 60,00 € bis zu kostenlosem');
    content = content.replace(/Bestellwert von 50€/g, 'Bestellwert von 60€');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        count++;
    }
}
console.log('Fixed ' + count + ' HTML files.');
