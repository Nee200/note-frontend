const fs = require('fs');
const path = require('path');

const cleanIntroText = (filename) => {
    const filePath = path.join(__dirname, filename);
    let content = fs.readFileSync(filePath, 'utf8');

    // Maches <p class="collection-intro" id="collection-intro-text"> ... text ... </p>
    const regex = /<p\s+class="collection-intro"\s+id="collection-intro-text">[\s\S]*?<\/p>/gi;

    if (regex.test(content)) {
        content = content.replace(regex, '');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Removed duplicate intro text from ${filename}`);
    } else {
        console.log(`Could not find intro text in ${filename}`);
    }
};

cleanIntroText('frauenduefte.html');
cleanIntroText('herrenduefte.html');
