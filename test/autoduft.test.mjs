import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { preview } from '../scripts/preview.mjs';
import { root } from '../scripts/build.mjs';

async function swipe(page, imageSelector, direction) {
    const rect = await page.$eval(imageSelector, e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
    const x = rect.x + rect.width * (direction < 0 ? .75 : .25), y = rect.y + rect.height / 2;
    const dx = rect.width * .5 * direction;
    const session = await page.createCDPSession();
    try {
        await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        for (let step = 1; step <= 6; step++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * step / 6, y }] });
        await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } finally { await session.detach(); }
}

test('Autoduft uses the shared cart and supports decoded gallery navigation on touch and desktop', { timeout: 120000 }, async () => {
    const server = await preview(0);
    const browser = await puppeteer.launch({ headless: true, ...(process.platform === 'win32' ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : {}), args: process.platform === 'linux' ? ['--no-sandbox'] : [] });
    try {
        for (const mobile of [true, false]) {
            const page = await browser.newPage(), errors = [], badImages = [];
            await page.setViewport({ width: mobile ? 390 : 1366, height: mobile ? 844 : 900, isMobile: mobile, hasTouch: mobile });
            await page.evaluateOnNewDocument(() => {
                localStorage.setItem('cookie_consent', 'necessary');
                localStorage.setItem('cart', JSON.stringify(Array.from({ length: 5 }, (_, index) => ({ id: `G${index + 1}-30`, productId: `G${index + 1}`, cartId: `G${index + 1}-30`, name: 'Testduft', size: 30, price: 34.99, quantity: 1, image: 'logo.webp' }))));
            });
            page.on('pageerror', error => errors.push(error.message));
            page.on('response', response => { if (response.request().resourceType() === 'image' && response.status() >= 400) badImages.push(response.url()); });
            await page.setRequestInterception(true);
            page.on('request', request => {
                const url = new URL(request.url());
                if (url.pathname === '/api/products') return request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': `http://127.0.0.1:${server.address().port}`, 'Access-Control-Allow-Credentials': 'true' }, body: '[]' });
                if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return request.abort();
                return request.continue();
            });
            await page.goto(`http://127.0.0.1:${server.address().port}/autoduft.html`, { waitUntil: 'load' });
            await page.click('#open-selector');
            await page.waitForSelector('#scent-modal.is-visible');
            await page.click('[data-scent-id="G351"]');
            await page.waitForFunction(() => document.querySelector('#scent-modal').hidden);
            await page.click('#add-btn');
            await page.waitForFunction(() => document.querySelector('[data-cart-drawer]').getAttribute('aria-hidden') === 'false');
            const item = '[data-cart-id="AUTODUFT-G351"]';
            await page.waitForSelector(item);
            await page.waitForFunction(() => { const r = document.querySelector('[data-cart-drawer]').getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1; });
            await page.click(item + ' [data-cart-action="increase"]');
            assert.equal(await page.evaluate(() => window.NoteCart.read().find(item => item.productId === 'AUTODUFT').quantity), 2);
            await page.click(item + ' [data-cart-action="decrease"]');
            assert.equal(await page.evaluate(() => window.NoteCart.read().find(item => item.productId === 'AUTODUFT').quantity), 1);
            assert.equal(await page.$eval('[data-cart-items]', e => getComputedStyle(e).overflowY), 'auto');
            await page.$eval('[data-cart-checkout]', e => e.scrollIntoView({ block: 'center' }));
            assert.equal(await page.$eval('[data-cart-checkout]', e => { const r = e.getBoundingClientRect(); return e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }), true, 'Checkout must remain reachable');
            await fs.mkdir(path.join(root, '.build-cache/qa'), { recursive: true });
            await page.screenshot({ path: path.join(root, '.build-cache/qa', `autoduft-cart-${mobile ? 'mobile' : 'desktop'}.png`) });
            await page.click(item + ' [data-cart-action="remove"]');
            assert.equal(await page.evaluate(() => window.NoteCart.read().some(item => item.productId === 'AUTODUFT')), false);
            await page.click('[data-cart-close]');
            await page.waitForFunction(() => document.querySelector('[data-cart-drawer]').getBoundingClientRect().left >= innerWidth - 1);
            await page.click('#header-cart');
            await page.waitForFunction(() => document.querySelector('[data-cart-drawer]').getAttribute('aria-hidden') === 'false');
            await page.waitForFunction(() => document.querySelector('[data-cart-drawer]').getBoundingClientRect().right <= innerWidth + 1);
            await page.click('[data-cart-close]');
            await page.waitForFunction(() => !document.documentElement.classList.contains('cart-drawer-open'));
            await page.waitForFunction(() => document.querySelector('[data-cart-drawer]').getBoundingClientRect().left >= innerWidth - 1);

            await page.$eval('#autoduft-main-image', e => e.scrollIntoView({ block: 'center' }));
            await page.click('[data-gallery-step="1"]');
            await page.waitForFunction(() => document.querySelector('#gallery-counter').textContent === '2 / 4');
            // Rapid changes must finish on the last requested image, without delayed older swaps.
            await page.evaluate(() => { const button = document.querySelector('[data-gallery-step="1"]'); button.click(); button.click(); button.click(); });
            await page.waitForFunction(() => document.querySelector('#gallery-counter').textContent === '1 / 4');
            assert.equal(await page.$eval('#autoduft-main-image', e => e.complete && e.naturalWidth > 0 && getComputedStyle(e).opacity === '1' && new URL(e.src).pathname.endsWith('.webp')), true);
            if (mobile) {
                await swipe(page, '#autoduft-main-image', -1);
                await page.waitForFunction(() => document.querySelector('#gallery-counter').textContent === '2 / 4');
            }
            await page.click('#open-image-lightbox');
            await page.waitForSelector('#image-lightbox.is-visible');
            const start = await page.$eval('#lightbox-counter', e => Number(e.textContent[0]));
            if (mobile) await swipe(page, '#image-lightbox-image', -1);
            else await page.click('[data-lightbox-step="1"]');
            await page.waitForFunction(index => document.querySelector('#lightbox-counter').textContent.startsWith(String(index % 4 + 1)), {}, start);
            assert.equal(await page.$eval('#image-lightbox', e => e.hidden), false);
            if (!mobile) {
                await page.keyboard.press('ArrowLeft');
                await page.waitForFunction(index => document.querySelector('#lightbox-counter').textContent.startsWith(String(index)), {}, start);
            }
            await page.waitForFunction(() => getComputedStyle(document.querySelector('#image-lightbox')).opacity === '1' && getComputedStyle(document.querySelector('.image-lightbox-dialog')).opacity === '1');
            await page.screenshot({ path: path.join(root, '.build-cache/qa', `autoduft-lightbox-${mobile ? 'mobile' : 'desktop'}.png`) });
            // Tap the blank area inside the dialog, outside the visible image.
            const outside = await page.evaluate(() => { const d = document.querySelector('.image-lightbox-dialog').getBoundingClientRect(), i = document.querySelector('#image-lightbox-image').getBoundingClientRect(); return i.y - d.y > 12 ? { x: d.x + d.width / 2, y: d.y + 5 } : { x: d.x + 5, y: d.y + d.height / 3 }; });
            await page.waitForFunction(() => document.querySelector('#image-lightbox-image').complete);
            // Finish the swipe's synthesized click before a separate backdrop tap.
            await new Promise(resolve => setTimeout(resolve, 400));
            if (mobile) await page.touchscreen.tap(outside.x, outside.y); else await page.mouse.click(outside.x, outside.y);
            await page.waitForFunction(() => document.querySelector('#image-lightbox').hidden);
            assert.equal(await page.evaluate(() => document.body.style.position), '');
            await page.click('#open-image-lightbox');
            await page.click('#close-image-lightbox');
            assert.equal(await page.$eval('#image-lightbox', e => e.hidden), true);
            assert.deepEqual(errors, []);
            assert.deepEqual(badImages, []);
            await page.close();
        }
    } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});

test('G1–G20 and L1–L20 have WebP assets and the catalog image wins on product pages', { timeout: 60000 }, async () => {
    const manifest = JSON.parse(await fs.readFile(path.join(root, 'dist/asset-manifest.json'), 'utf8'));
    for (const prefix of ['g', 'l']) for (let number = 1; number <= 20; number++) {
        const key = `images_website/new-arrivals/${prefix}${number}-notes-v3-natural-v1.webp`;
        const bytes = await fs.readFile(path.join(root, 'dist', manifest[key]));
        assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
        assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    }
    const server = await preview(0);
    const browser = await puppeteer.launch({ headless: true, ...(process.platform === 'win32' ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : {}), args: process.platform === 'linux' ? ['--no-sandbox'] : [] });
    try {
        for (const id of ['G1', 'L12']) {
            const image = `images_website/new-arrivals/${id.toLowerCase()}-notes-v3-natural-v1.webp`;
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            page.on('request', request => {
                const url = new URL(request.url());
                if (url.pathname.startsWith('/api/')) {
                    const body = url.pathname === '/api/products' ? [{ id, name: id, category: id[0] === 'G' ? 'men' : 'women', variants: { 30: { price: 34.99 }, 50: { price: 44.99 } }, images: [image, 'logo.webp'], reviewSummary: { average: 0, count: 0 } }] : {};
                    return request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': `http://127.0.0.1:${server.address().port}`, 'Access-Control-Allow-Credentials': 'true' }, body: JSON.stringify(body) });
                }
                if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return request.abort();
                return request.continue();
            });
            await page.goto(`http://127.0.0.1:${server.address().port}/product.html?id=${id}`, { waitUntil: 'load' });
            await page.waitForFunction(expected => { const image = document.querySelector('#detail-main-image'); return image?.complete && image.naturalWidth > 0 && image.getAttribute('src') === expected; }, {}, image);
            await page.close();
        }
    } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
