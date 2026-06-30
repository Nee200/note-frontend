const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.note-fragrances.de';
const PRODUCTS_API_URL = process.env.PRODUCTS_API_URL || 'https://note-backend-5gy0.onrender.com/api/products';
const OUTPUT_PATH = path.resolve(__dirname, '..', 'sitemap.xml');

const staticPages = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    { loc: '/suche.html', changefreq: 'weekly', priority: '0.8' },
    { loc: '/duftzwillinge.html', changefreq: 'weekly', priority: '0.9' },
    { loc: '/frauenduefte.html', changefreq: 'weekly', priority: '0.8' },
    { loc: '/herrenduefte.html', changefreq: 'weekly', priority: '0.8' },
    { loc: '/ueber-uns.html', changefreq: 'monthly', priority: '0.6' },
    { loc: '/kontakt.html', changefreq: 'monthly', priority: '0.6' },
    { loc: '/versand.html', changefreq: 'monthly', priority: '0.5' },
    { loc: '/impressum.html', changefreq: 'yearly', priority: '0.3' },
    { loc: '/datenschutz.html', changefreq: 'yearly', priority: '0.3' },
    { loc: '/agb.html', changefreq: 'yearly', priority: '0.3' },
    { loc: '/widerrufsrecht.html', changefreq: 'yearly', priority: '0.3' }
];

function escapeXml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function buildUrl(pathname) {
    return new URL(pathname, SITE_URL).href;
}

function buildProductUrl(productId) {
    const url = new URL('/product.html', SITE_URL);
    url.searchParams.set('id', String(productId));
    return url.href;
}

function buildEntry({ loc, lastmod, changefreq, priority }) {
    return [
        '  <url>',
        `    <loc>${escapeXml(loc)}</loc>`,
        `    <lastmod>${escapeXml(lastmod)}</lastmod>`,
        `    <changefreq>${escapeXml(changefreq)}</changefreq>`,
        `    <priority>${escapeXml(priority)}</priority>`,
        '  </url>'
    ].join('\n');
}

async function main() {
    const response = await fetch(PRODUCTS_API_URL);
    if (!response.ok) {
        throw new Error(`Product API returned ${response.status}`);
    }

    const products = await response.json();
    if (!Array.isArray(products)) {
        throw new Error('Product API did not return an array');
    }

    const today = new Date().toISOString().slice(0, 10);
    const seenProductIds = new Set();

    const entries = staticPages.map((page) => buildEntry({
        loc: buildUrl(page.loc),
        lastmod: today,
        changefreq: page.changefreq,
        priority: page.priority
    }));

    products
        .filter((product) => product && product.id)
        .forEach((product) => {
            const id = String(product.id).trim();
            if (!id || seenProductIds.has(id)) return;
            seenProductIds.add(id);
            entries.push(buildEntry({
                loc: buildProductUrl(id),
                lastmod: today,
                changefreq: 'weekly',
                priority: '0.7'
            }));
        });

    const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        entries.join('\n'),
        '</urlset>',
        ''
    ].join('\n');

    fs.writeFileSync(OUTPUT_PATH, sitemap, 'utf8');
    console.log(`Generated ${OUTPUT_PATH} with ${entries.length} URLs (${seenProductIds.size} products).`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
