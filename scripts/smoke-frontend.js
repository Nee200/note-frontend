const assert = require('assert');

const baseUrl = (process.env.FRONTEND_BASE_URL || 'http://localhost:5500').replace(/\/+$/, '');
const pages = (process.env.FRONTEND_SMOKE_PAGES || [
    '/',
    '/index.html',
    '/product.html',
    '/suche.html',
    '/impressum.html',
    '/datenschutz.html',
    '/widerrufsrecht.html'
].join(','))
    .split(',')
    .map((page) => page.trim())
    .filter(Boolean);

async function main() {
    console.log(`[smoke] Frontend base URL: ${baseUrl}`);

    for (const page of pages) {
        const url = `${baseUrl}${page.startsWith('/') ? page : `/${page}`}`;
        const response = await fetch(url, { redirect: 'follow' });
        const text = await response.text();

        assert.ok(response.status >= 200 && response.status < 400, `${url} returned ${response.status}`);
        assert.ok(/<html[\s>]/i.test(text), `${url} did not look like HTML`);
        assert.ok(/<title>.+<\/title>/is.test(text) || page === '/', `${url} has no title`);

        console.log(`[smoke] ${page} ok (${response.status})`);
    }

    console.log('[smoke] Frontend smoke passed');
}

main().catch((error) => {
    console.error('[smoke] Frontend smoke failed');
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
});
