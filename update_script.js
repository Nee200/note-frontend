const fs = require('fs');

const path = 'c:/Webserver/OnlineShop/frontend/script.js';
let s = fs.readFileSync(path, 'utf8');

// The regex will remove the `const products = [ { ... } ];` array entirely.
s = s.replace(/const products = \[[\s\S]*?\];\n\n/, 'let products = [];\n\n');

// We also need to rewrite the init() function in frontend/script.js to fetch products first.
s = s.replace(/function init\(\) \{[\s\S]*?renderProducts\(defaultCategory\);\n            \}\n        \}\n\n        if \(bestsellerWomenGrid \|\| bestsellerMenGrid\) \{\n            renderBestsellers\(\);\n        \}\n    \}/, `async function init() {
    try {
        const res = await fetch(API_BASE_URL + '/api/products');
        if (res.ok) {
            products = await res.json();
        } else {
            console.error('Failed to load products');
        }
    } catch (e) {
        console.error('Error fetching products:', e);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const categoryParam = urlParams.get('category');
    const defaultCategory = document.body ? document.body.dataset.defaultCategory : null;
    const hasProductGrid = !!document.getElementById('product-grid');

    if (productId && products.length > 0) {
        renderProductDetail(productId);
    } else {
        if (hasProductGrid) {
            if (categoryParam) {
                renderProducts(categoryParam);
            } else if (defaultCategory) {
                renderProducts(defaultCategory);
            } else {
                renderProducts();
            }
            initProductControls();
        }

        if (bestsellerWomenGrid || bestsellerMenGrid) {
            renderBestsellers();
        }
    }`);

fs.writeFileSync(path, s);
console.log('Script updated');
