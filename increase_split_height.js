const fs = require('fs');

const increaseHeight = (filename) => {
    let content = fs.readFileSync(filename, 'utf8');

    // Replace min-height: 35vh with min-height: 40vh
    content = content.replace(/min-height:\s*35vh;/g, 'min-height: 40vh;');
    
    // Replace padding: 5% 6% with padding: 7% 7%
    content = content.replace(/padding:\s*5%\s*6%;/g, 'padding: 7% 7%;');

    // Replace min-height: 250px for the image with min-height: 300px
    content = content.replace(/min-height:\s*250px;/g, 'min-height: 300px;');

    fs.writeFileSync(filename, content, 'utf8');
};

increaseHeight('frauenduefte.html');
increaseHeight('herrenduefte.html');
console.log('Heights slightly thickened across the split banners!');
