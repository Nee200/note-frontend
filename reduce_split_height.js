const fs = require('fs');

const reduceHeight = (filename) => {
    let content = fs.readFileSync(filename, 'utf8');

    // Replace min-height: 50vh with min-height: 35vh
    content = content.replace(/min-height:\s*50vh;/g, 'min-height: 35vh;');
    
    // Replace padding: 10% 8% with padding: 5% 6% to allow it to shrink
    content = content.replace(/padding:\s*10%\s*8%;/g, 'padding: 5% 6%;');

    // It also had min-height: 350px for the image
    content = content.replace(/min-height:\s*350px;/g, 'min-height: 250px;');

    fs.writeFileSync(filename, content, 'utf8');
};

reduceHeight('frauenduefte.html');
reduceHeight('herrenduefte.html');
console.log('Heights reduced globally across the split banners!');
