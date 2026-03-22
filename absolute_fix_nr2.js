const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// The file currently has a literal "\\n" string on line 568. Let's fix that!
html = html.replace("JSON.stringify({ email })\\n                });", "JSON.stringify({ email })\n                });");
    
fs.writeFileSync('index.html', html);
console.log("Fixed literal newline character");
