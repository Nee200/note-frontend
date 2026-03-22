const fs = require('fs');

function unifyToolbar(filename) {
    let content = fs.readFileSync(filename, 'utf8');

    // Maches the old category toolbar completely up to <p id="product-count-info"...>
    const regex = /<div class="category-toolbar">[\s\S]*?<p id="product-count-info" class="product-count-info"><\/p>/gi;

    const replacement = `<!-- MINIMALIST UNIFIED TOOLBAR -->
        <div class="category-toolbar-minimal" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eaeaea; padding-bottom: 0.75rem; margin-top: -1.5rem; margin-bottom: 2rem;">
            <div id="product-count-info" class="product-count-info" style="font-size: 0.85rem; color: #888; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;"></div>
            
            <!-- Hidden search to prevent JS errors if script expects it -->
            <input type="hidden" id="product-filter-input">
            
            <div class="category-toolbar-right" style="position: relative;">
                <select id="product-sort-select" style="appearance: none; -webkit-appearance: none; border: none; background: transparent; font-family: 'Inter', sans-serif; font-size: 0.85rem; color: #333; cursor: pointer; outline: none; padding-right: 1.5rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">
                    <option value="name-asc">Sortieren: A–Z</option>
                    <option value="price-asc">Preis aufsteigend</option>
                    <option value="price-desc">Preis absteigend</option>
                    <option value="bestseller-first">Bestseller zuerst</option>
                </select>
                <!-- Custom minimal dropdown arrow -->
                <i class="fas fa-chevron-down" style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); font-size: 0.7rem; color: #333; pointer-events: none;"></i>
            </div>
        </div>`;

    if (regex.test(content)) {
        content = content.replace(regex, replacement);
        fs.writeFileSync(filename, content, 'utf8');
        console.log(`Unified toolbar on ${filename}`);
    } else {
        console.log(`Could not find toolbar on ${filename}`);
    }
}

unifyToolbar('frauenduefte.html');
unifyToolbar('herrenduefte.html');
