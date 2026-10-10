import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import { parse, serializeOuter } from 'parse5';
import puppeteer from 'puppeteer';

const source = await fs.readFile(new URL('../duftroller-shop.js', import.meta.url), 'utf8');
const styles = (await Promise.all(['style.css', 'style-wave-home.css', 'configurable-product.css', 'duftroller.css', 'duftroller-shop.css']
    .map(name => fs.readFile(new URL(`../${name}`, import.meta.url), 'utf8')))).join('\n');
const productImages = new Map(await Promise.all(['g333-comparison-v1.webp', 'g343-comparison-v1.webp', 'l203-comparison-v1.webp', 'l62-comparison-transparent-v2.webp']
    .map(async name => [name, await fs.readFile(new URL(`../images_website/bestsellers/${name}`, import.meta.url))])));

function findByClass(node, name) {
    if (node.attrs?.some(attr => attr.name === 'class' && attr.value.split(/\s+/).includes(name))) return node;
    for (const child of node.childNodes || []) { const match = findByClass(child, name); if (match) return match; }
}

const catalog = [
    { id: 'G333', category: 'men', publicName: 'Royal Cherry', images: ['images_test/g333.svg'], variants: { 30: { price: 29.95 }, 50: { price: 42.25 } } },
    { id: 'G343', category: 'men', publicName: 'Blue After Dark Exclusive', images: ['images_test/g343.svg'], variants: { 30: { price: 32.75 }, 50: { price: 45.25 } } },
    { id: 'L203', category: 'women', publicName: 'Blush After Midnight', images: ['images_test/l203.svg'], variants: { 30: { price: 35.5 }, 50: { price: 46.5 } } },
    { id: 'L62', category: 'women', publicName: 'Whispers of Devotion', images: ['images_test/l62.svg'], variants: { 30: { price: 36.95 }, 50: { price: 47.95 } } }
];

async function fixture(t) {
    // Test the actual integrated markup rather than a second copy of the fragment.
    const document = parse(await fs.readFile(new URL('../duftroller.html', import.meta.url), 'utf8'));
    const timeline = findByClass(document, 'roller-delivery-timeline');
    const tail = findByClass(document, 'roller-shop-tail');
    assert.ok(timeline && tail, 'Timeline and shop tail must be integrated into duftroller.html');
    const html = `<!doctype html><html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${styles}</style></head>
      <body class="autoduft-page duftroller-page"><main class="page roller-page"><div class="roller-trust" style="max-width:480px;margin:auto">${serializeOuter(timeline)}</div>${serializeOuter(tail)}</main><script src="/shop.js"></script></body></html>`;
    const server = http.createServer((request, response) => {
        if (request.url === '/shop.js') { response.setHeader('Content-Type', 'text/javascript; charset=utf-8'); return response.end(source); }
        const image = productImages.get(request.url.replace(/^\/(?:assets|images_website\/bestsellers)\//, ''));
        if (image) {
            response.setHeader('Content-Type', 'image/webp');
            return response.end(image);
        }
        if (request.url === '/') { response.setHeader('Content-Type', 'text/html; charset=utf-8'); return response.end(html); }
        response.writeHead(404); response.end();
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const browser = await puppeteer.launch({ headless: true,
        ...(process.platform === 'win32' ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : {}),
        args: process.platform === 'linux' ? ['--no-sandbox'] : [] });
    t.after(async () => { await browser.close(); await new Promise(resolve => server.close(resolve)); });

    async function pageFor({ products = catalog, date = '2026-10-09T10:00:00Z', fail = false, width = 390, delay = 0 } = {}) {
        const page = await browser.newPage(), errors = [], external = [];
        await page.setViewport({ width, height: 844 });
        await page.emulateTimezone('America/Los_Angeles');
        page.on('pageerror', error => errors.push(error.message));
        await page.setRequestInterception(true);
        page.on('request', request => {
            if (!request.url().startsWith(origin + '/')) { external.push(request.url()); return request.abort(); }
            return request.continue();
        });
        await page.evaluateOnNewDocument((products, date, fail, delay) => {
            window.shopClock = date;
            const NativeDate = Date;
            window.Date = class extends NativeDate {
                constructor(...args) { super(...(args.length ? args : [window.shopClock])); }
                static now() { return new NativeDate(window.shopClock).getTime(); }
            };
            window.catalog = products; window.failCatalog = fail; window.catalogCalls = 0;
            window.loadStorefrontProducts = async () => {
                window.catalogCalls += 1;
                if (delay) await new Promise(resolve => setTimeout(resolve, delay));
                if (window.failCatalog) throw new Error('Synthetic unavailable API');
                return window.catalog;
            };
            window.NoteAssets = { image: source => source.replace('images_website/bestsellers/', 'assets/') };
        }, products, date, fail, delay);
        await page.goto(origin, { waitUntil: 'load' });
        await page.waitForFunction(() => document.querySelector('#roller-recommendations-grid').getAttribute('aria-busy') === 'false');
        return { page, errors, external };
    }
    return { pageFor };
}

test('delivery estimates use German calendar dates and 1–3 working days across weekends, DST and year changes', { timeout: 60000 }, async t => {
    const { pageFor } = await fixture(t);
    const cases = [
        ['2026-10-09T10:00:00Z', '2026-10-09', '2026-10-12', '2026-10-14'],
        ['2026-10-09T23:30:00Z', '2026-10-10', '2026-10-12', '2026-10-14'],
        ['2026-10-11T10:00:00Z', '2026-10-11', '2026-10-12', '2026-10-14'],
        ['2026-10-08T00:30:00Z', '2026-10-08', '2026-10-09', '2026-10-13'],
        ['2026-10-23T10:00:00Z', '2026-10-23', '2026-10-26', '2026-10-28'],
        ['2026-12-31T10:00:00Z', '2026-12-31', '2027-01-01', '2027-01-05']
    ];
    const { page, errors } = await pageFor();
    for (const [clock, ordered, first, last] of cases) {
        await page.evaluate(clock => { window.shopClock = clock; window.dispatchEvent(new Event('focus')); }, clock);
        assert.equal(await page.$eval('#roller-delivery-ordered', node => node.dateTime), ordered);
        assert.equal(await page.$eval('#roller-delivery-shipped time', node => node.dateTime), first);
        assert.deepEqual(await page.$$eval('#roller-delivery-delivered time', nodes => nodes.map(node => node.dateTime)), [first, last]);
        assert.match(await page.$eval('#roller-delivery-note', node => node.textContent), /Feiertage/);
        assert.deepEqual(await page.$$eval('.roller-delivery-estimate', nodes => nodes.slice(1).map(node => node.textContent)), ['Voraussichtlich', 'Voraussichtlich']);
    }
    assert.match(await page.$eval('#roller-delivery-delivered', node => node.textContent), /2027/);
    assert.deepEqual(errors, []);
});

test('recommendations use real API values, safe DOM, local images and omit unusable prices', { timeout: 60000 }, async t => {
    const { pageFor } = await fixture(t);
    const normal = await pageFor({ products: [...catalog].reverse() });
    assert.deepEqual(await normal.page.$$eval('.roller-recommendation-card', nodes => nodes.map(node => node.dataset.productId)), ['G333', 'G343', 'L203', 'L62']);
    assert.match(await normal.page.$eval('.roller-recommendation-price', node => node.textContent), /29,95/);
    assert.match(await normal.page.$eval('.roller-recommendation-unit', node => node.textContent), /998,33/);
    assert.equal(await normal.page.$eval('.roller-recommendation-card', node => new URL(node.href).searchParams.get('id')), 'G333');
    assert.deepEqual(normal.errors, []);

    const products = structuredClone(catalog);
    products[0].publicName = '<img src=x onerror="window.injected=true"> & Royal';
    products[0].images = ['javascript:alert(1)', 'https://external.example/image.webp', 'images_test/g333.svg'];
    products[1].images = ['https://external.example/tracker.webp'];
    products[1].variants = { 30: { price: 0 }, 50: { price: 17.75 } };
    products[2].variants = { 30: { price: '35.50' }, 50: { price: -12 } };
    products[3].variants = { 30: { price: null }, 50: { price: 0.001 } };
    const { page, errors, external } = await pageFor({ products });
    assert.deepEqual(await page.$$eval('.roller-recommendation-card', nodes => nodes.map(node => node.dataset.productId)), ['G333', 'G343']);
    assert.equal(await page.$eval('.roller-recommendation-name', node => node.textContent), products[0].publicName);
    assert.equal(await page.$$eval('.roller-recommendation-name img', nodes => nodes.length), 0);
    assert.equal(await page.evaluate(() => !!window.injected), false);
    assert.match(await page.$eval('[data-product-id="G343"] .roller-recommendation-price', node => node.textContent), /^17,75/);
    assert.match(await page.$eval('[data-product-id="G343"] .roller-recommendation-unit', node => node.textContent), /50 ml · 355,00/);
    assert.match(await page.$eval('[data-product-id="G343"] img', node => node.src), /\/assets\/g343-comparison-v1.webp$/);
    assert.match(await page.$eval('[data-product-id="G333"] img', node => node.src), /\/assets\/g333-comparison-v1.webp$/);
    await page.$eval('[data-product-id="G343"] img', node => { node.src = '/unavailable.webp'; });
    await page.waitForFunction(() => document.querySelector('[data-product-id="G343"] .roller-recommendation-visual').textContent === 'Bild nicht verfügbar');
    assert.deepEqual(external, []);
    assert.deepEqual(errors, []);
});

test('catalog retry retains keyboard focus and the complete shop tail fits phone, tablet and desktop', { timeout: 60000 }, async t => {
    const { pageFor } = await fixture(t);
    const { page, errors } = await pageFor({ fail: true, delay: 150 });
    assert.equal(await page.$$eval('.roller-recommendation-card', nodes => nodes.length), 0);
    assert.match(await page.$eval('#roller-recommendations-message', node => node.textContent), /nicht verfügbar/);
    await page.evaluate(() => { window.failCatalog = false; });
    await page.focus('#roller-recommendations-retry');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'roller-recommendations-retry');
    await page.waitForSelector('.roller-recommendation-card');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.productId), 'G333');
    assert.equal(await page.evaluate(() => window.catalogCalls), 2);
    assert.equal(await page.$eval('#roller-recommendations-status', node => node.hidden), true);

    for (const width of [320, 390, 620, 768, 1440]) {
        await page.setViewport({ width, height: 844 });
        const layout = await page.evaluate(() => ({
            pageWidth: document.documentElement.scrollWidth, viewport: innerWidth,
            columns: getComputedStyle(document.querySelector('#roller-recommendations-grid')).gridTemplateColumns.split(' ').length,
            clipped: [...document.querySelectorAll('.roller-recommendation-card,.roller-format-table,.roller-delivery-steps,.roller-shop-fact')].some(node => {
                const rect = node.getBoundingClientRect(); return rect.left < 0 || rect.right > innerWidth + 1 || node.scrollWidth > node.clientWidth + 1;
            })
        }));
        assert.ok(layout.pageWidth <= layout.viewport, `No horizontal page overflow at ${width}px`);
        assert.equal(layout.clipped, false, `No clipped content at ${width}px`);
        assert.equal(layout.columns, width <= 620 ? 2 : 4);
    }
    await page.focus('.roller-general-faq summary');
    await page.keyboard.press('Enter');
    assert.equal(await page.$eval('.roller-general-faq details', node => node.open), true);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('href')), 'suche.html');
    assert.deepEqual(errors, []);
});
