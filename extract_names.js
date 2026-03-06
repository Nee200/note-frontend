const fs = require('fs');
const code = fs.readFileSync('tmp_products.js', 'utf8');
const matchIter = code.matchAll(/inspiredBy:\s*"([^"]+)"/g);
const names = new Set();
for (const m of matchIter) {
    names.add(m[1]);
}
fs.writeFileSync('unique_names.json', JSON.stringify(Array.from(names), null, 2));
console.log('Saved ' + names.size + ' unique names.');
