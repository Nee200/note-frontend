const fs = require('fs');
const filename = 'kontakt.html';
let content = fs.readFileSync(filename, 'utf8');

// Replace standard <!-- Navigation --> with </div> <!-- Navigation -->
content = content.replace(/<!-- Navigation -->/gi, '</div>\n\n    <!-- Navigation -->');

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed missing div in kontakt.html');
