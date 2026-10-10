import { test } from 'node:test';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { preview } from '../scripts/preview.mjs';

const rollerImage = size => `images_website/duftroller/note-duftroller-${size}-closed-v1.webp`;
const roller = {
    id: 'DUFTROLLER', name: 'Duftroller', publicName: 'Duftroller', category: 'duftroller',
    description: 'Dein Lieblingsduft zum Aufrollen.', images: [rollerImage(6)],
    variants: { 6: { price: 12.5 }, 10: { price: 16 }, 14: { price: 19.5 } },
    reviewSummary: { average: 0, count: 0 }
};
const perfume = {
    id: 'G1', name: 'G1', publicName: 'Beyond Bergamot', category: 'men',
    description: 'Synthetischer Testduft', images: ['logo.webp'],
    variants: { 30: { price: 34.99 }, 50: { price: 44.99 } },
    reviewSummary: { average: 0, count: 0 }
};
const seedCart = [6, 10, 14].map(size => ({
    id: `DUFTROLLER-${size}-G1`, cartId: `DUFTROLLER-${size}-G1`, productId: 'DUFTROLLER',
    productType: 'duftroller', size: String(size), scentId: 'G1', scentName: 'Beyond Bergamot',
    name: `NØTE. Duftroller (${size}ml)`, quantity: 1, price: 1, image: 'logo.webp'
}));

test('Duftroller cart variants survive shared pages, correct their prices/images and serialize secure checkout IDs', { timeout: 120000 }, async () => {
    const server = await preview(0);
    const origin = `http://127.0.0.1:${server.address().port}`;
    const browser = await puppeteer.launch({ headless: true,
        ...(process.platform === 'win32' ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : {}),
        args: process.platform === 'linux' ? ['--no-sandbox'] : [] });
    try {
        for (const [file, width] of [['index.html', 1366], ['autoduft.html', 390], ['product.html?id=G1', 1366], ['suche.html?q=Duftroller', 390]]) {
            const page = await browser.newPage(), errors = [], checkoutRequests = [];
            await page.setViewport({ width, height: 900, isMobile: width < 600, hasTouch: width < 600 });
            await page.evaluateOnNewDocument(cart => {
                localStorage.setItem('cart', JSON.stringify(cart));
                localStorage.setItem('cookie_consent', 'necessary');
                localStorage.setItem('nl_dismissed', '1');
            }, seedCart);
            page.on('pageerror', error => errors.push(error.message));
            await page.setRequestInterception(true);
            page.on('request', request => {
                const url = new URL(request.url());
                if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/create-')) {
                    const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type, x-csrf-token, idempotency-key' };
                    if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
                    let body = {};
                    if (url.pathname === '/api/products') body = [perfume, roller];
                    if (url.pathname.endsWith('/reviews')) body = { reviews: [], summary: { average: 0, count: 0 } };
                    if (url.pathname === '/api/csrf-token') body = { csrfToken: 'synthetic-token' };
                    if (url.pathname === '/create-checkout-session') {
                        checkoutRequests.push(JSON.parse(request.postData()));
                        body = { safeMode: true };
                    }
                    return request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify(body) });
                }
                if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return request.abort();
                return request.continue();
            });
            await page.goto(`${origin}/${file}`, { waitUntil: 'load' });
            await page.evaluate(() => document.fonts.ready);
            await page.waitForFunction(() => window.NoteCart.read().reduce((sum, item) => sum + item.price, 0) === 48);
            assert.equal(await page.$eval('[data-cart-subtotal]', element => element.textContent.replace(/\s/g, '')), '48,00€', file);
            assert.equal(await page.$$eval('#main-navigation a[href="duftroller.html"]', links => links.length), 1);
            assert.equal(await page.$$eval('.footer a[href="duftroller.html"]', links => links.length), 1);
            if (file.startsWith('suche')) {
                await page.waitForSelector('#product-grid .shop-product-card[href="duftroller.html"]');
                assert.match(await page.$eval('#product-grid .shop-product-card[href="duftroller.html"]', element => element.textContent), /12,50/);
            }
            assert.ok(await page.$eval('[data-cart-drawer]', element => element.inert && getComputedStyle(element).visibility === 'hidden'), file + ' closed cart must be inert and visually hidden');
            await page.click('[data-cart-open]');
            await page.waitForFunction(() => document.querySelector('[data-cart-drawer]').getBoundingClientRect().right <= innerWidth + 1);
            assert.ok(await page.$eval('[data-cart-drawer]', element => !element.inert && element.getAttribute('role') === 'dialog' && element.getAttribute('aria-modal') === 'true'));
            assert.ok(await page.evaluate(() => document.activeElement.matches('[data-cart-close]') && document.querySelector('.site-header').inert), file + ' open cart must focus its close button and disable the background');
            await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
            assert.ok(await page.evaluate(() => document.querySelector('[data-cart-drawer]').contains(document.activeElement) && !document.activeElement.matches('[data-cart-close]')), 'backward Tab must stay inside the cart');
            await page.keyboard.press('Tab');
            assert.ok(await page.evaluate(() => document.activeElement.matches('[data-cart-close]')), 'forward Tab must wrap to the close button');
            for (const [size, price] of [[6, '12,50'], [10, '16,00'], [14, '19,50']]) {
                const selector = `[data-cart-id="DUFTROLLER-${size}-G1"]`;
                assert.match(await page.$eval(`${selector} .wave-cart-copy small`, element => element.textContent), new RegExp(`${size} ml · G1 · Beyond Bergamot`));
                assert.match(await page.$eval(`${selector} .wave-cart-price`, element => element.textContent), new RegExp(price));
                assert.equal(await page.$eval(`${selector} a`, element => element.getAttribute('href')), 'duftroller.html');
                await page.waitForFunction(({ selector, source }) => {
                    const image = document.querySelector(selector + ' img');
                    return image?.complete && image.naturalWidth > 0 && new URL(image.src).pathname === new URL(window.NoteAssets.image(source), location.href).pathname;
                }, {}, { selector, source: rollerImage(size) });
            }
            await page.$eval('[data-cart-checkout]', element => element.scrollIntoView({ block: 'center' }));
            await page.click('[data-cart-checkout]');
            await page.waitForFunction(() => document.querySelector('[data-cart-status]').textContent.includes('Safe-Mode'));
            assert.deepEqual(checkoutRequests[0], { items: seedCart.map(({ id, quantity }) => ({ id, quantity })) });
            const smallRoller = '[data-cart-id="DUFTROLLER-6-G1"]';
            await page.$eval(`${smallRoller} [data-cart-action="increase"]`, element => element.scrollIntoView({ block: 'center' }));
            await page.click(`${smallRoller} [data-cart-action="increase"]`);
            await page.waitForFunction(() => window.NoteCart.read().find(item => item.id === 'DUFTROLLER-6-G1').quantity === 2);
            assert.equal(await page.$eval('[data-cart-total]', element => element.textContent.replace(/\s/g, '')), '60,50€');
            assert.equal(await page.$eval('[data-cart-shipping]', element => element.textContent), 'Kostenlos');
            await page.click(`${smallRoller} [data-cart-action="remove"]`);
            await page.waitForFunction(() => !window.NoteCart.read().some(item => item.id === 'DUFTROLLER-6-G1'));
            assert.equal(await page.$eval('[data-cart-total]', element => element.textContent.replace(/\s/g, '')), '42,49€');
            await page.keyboard.press('Escape');
            assert.ok(await page.evaluate(() => document.querySelector('[data-cart-drawer]').inert && !document.querySelector('.site-header').inert && document.activeElement.matches('[data-cart-open]')), file + ' Escape must restore page focus');
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), file + ' must fit the viewport');
            assert.deepEqual(errors, [], file);
            await page.close();
        }
    } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
