import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { preview } from '../scripts/preview.mjs';
import { entries, root } from '../scripts/build.mjs';
const products = ['G1', 'G2', 'L1'].map((id, i) => ({ id, name: 'NØTE. ' + id, publicName: 'Synthetic Fragrance', category: i === 2 ? 'women' : 'men', inspiredBy: 'Synthetic', description: 'Ein synthetisches Testprodukt.', longDescription: 'Beschreibung für einen isolierten Browsertest.', notes: { head: 'Zitrone', heart: 'Lavendel', base: 'Holz' }, bestseller: true, newArrival: true, images: ['images_parfume/parfume_mann.png'], variants: { 30: { price: 29.99 }, 50: { price: 44.99 } }, reviewSummary: { average: 0, count: 0 } }));

test('all published pages load under CSP; malformed carts, mobile layouts and real click handlers work', { timeout: 180000 }, async () => {
    const server = await preview(0); let browser;
    const results = [], failures = [], external = [];
    try {
        const chrome = process.env.PUPPETEER_EXECUTABLE_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);
        browser = await puppeteer.launch({ headless: true, ...(chrome ? { executablePath: chrome } : {}), args: process.platform === 'linux' ? ['--no-sandbox'] : [] });
        for (const file of entries) {
            let adminLoggedIn = false;
            const order = { _id: '0123456789abcdef01234567', orderNumber: '#TEST-1', date: new Date().toISOString(), email: 'synthetic@example.test', name: 'Synthetic Customer', amount: 2999, currency: 'eur', paymentStatus: 'unpaid', status: 'neu', address: { line1: 'Selbstabholung', country: 'DE' }, items: [{ description: 'Testduft', quantity: 1, lineTotalCents: 2999 }] };
            const page = await browser.newPage();
            await page.setViewport({ width: ['product.html', 'index.html', 'autoduft.html', 'account.html'].includes(file) ? 390 : 1366, height: 900 });
            await page.evaluateOnNewDocument(seed => { localStorage.setItem('cart', seed); localStorage.setItem('cookie_consent', 'necessary'); }, file === 'autoduft.html' ? '{}' : '{broken');
            await page.setRequestInterception(true);
            page.on('pageerror', error => failures.push({ file, kind: 'javascript', message: error.message }));
            page.on('response', response => { const url = new URL(response.url()); if (response.status() >= 400 && !url.pathname.startsWith('/api/')) failures.push({ file, kind: 'resource', message: response.status() + ' ' + url.pathname }); });
            page.on('console', message => { if (message.type() === 'error' && /Content Security|Refused to|Executing inline|blocked/i.test(message.text())) failures.push({ file, kind: 'csp', message: message.text().slice(0, 400) }); });
            page.on('request', request => {
                const url = new URL(request.url());
                if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/create-')) {
                    const headers = { 'Access-Control-Allow-Origin': 'http://127.0.0.1:' + server.address().port, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS', 'Access-Control-Allow-Headers': 'content-type, x-csrf-token, idempotency-key' };
                    if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
                    let body = {}, status = 200;
                    if (url.pathname === '/api/products') body = products;
                    else if (url.pathname.endsWith('/reviews')) body = { reviews: [], summary: { average: 0, count: 0 }, userReview: null };
                    else if (url.pathname === '/api/csrf-token') body = { csrfToken: 'synthetic-token' };
                    else if (url.pathname === '/api/admin/login') {
                        const input = JSON.parse(request.postData()); assert.equal(input.username, 'owner'); assert.equal(input.otp, '123456');
                        adminLoggedIn = true; body = { success: true, features: { invoices: false } };
                    }
                    else if (url.pathname === '/api/admin/check' && adminLoggedIn) body = { success: true, features: { invoices: false } };
                    else if (url.pathname === '/api/user' || url.pathname === '/api/admin/check') { status = 401; body = { error: 'Nicht angemeldet' }; }
                    else if (url.pathname === '/api/admin/orders') body = { orders: [order], page: 1, hasMore: false };
                    else if (url.pathname.endsWith('/confirm-cash')) { const input = JSON.parse(request.postData()); assert.equal(input.receivedAmountCents, 2999); assert.equal(input.receiptReference, 'TEST-RECEIPT'); order.paymentStatus = 'paid'; body = { success: true, order }; }
                    else if (url.pathname === '/api/commerce-config') body = { shippingCents: 699, freeShippingThresholdCents: 6000, countries: ['DE'] };
                    else if (url.pathname === '/api/newsletter') body = { success: true, requiresConfirmation: true, message: 'Bitte bestätige deine Anmeldung.' };
                    return request.respond({ status, contentType: 'application/json', headers, body: JSON.stringify(body) });
                }
                if (['http:', 'https:'].includes(url.protocol) && url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') { external.push({ file, url: url.origin + url.pathname }); return request.abort(); }
                return request.continue();
            });
            const response = await page.goto('http://127.0.0.1:' + server.address().port + '/' + file + (file === 'product.html' ? '?id=G1' : ''), { waitUntil: 'networkidle0' });
            assert.equal(response.status(), 200);
            const layout = await page.evaluate(() => ({ title: document.title, overflow: document.documentElement.scrollWidth - innerWidth, inlineHandlers: document.querySelectorAll('[onclick],[onchange],[onsubmit],[onerror]').length }));
            assert.equal(layout.inlineHandlers, 0, file + ' has inline event code');
            if (layout.overflow > 2) failures.push({ file, kind: 'layout', message: 'Horizontal overflow ' + layout.overflow });
            if (file === 'account.html') {
                await page.click('[data-note-onclick]');
                assert.ok(await page.$('.reg-modal-backdrop.open, .reg-modal-backdrop.active') || await page.evaluate(() => getComputedStyle(document.getElementById('reg-modal-backdrop')).display !== 'none'), 'Registration modal should open');
            }
            if (file === 'product.html') {
                const button = await page.$('#detail-add-btn');
                if (button) {
                    await button.click(); await page.waitForFunction(() => window.NoteCart.read().length > 0);
                    await page.waitForFunction(() => { const rect = document.querySelector('[data-cart-drawer]').getBoundingClientRect(); return rect.left >= -1 && rect.right <= innerWidth + 1; });
                    const reachable = await page.evaluate(() => { const button = document.querySelector('[data-cart-close]'), rect = button.getBoundingClientRect(); return button.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)); });
                    assert.equal(reachable, true, 'Cart close button must not be covered by the promotion/header');
                    await fs.mkdir(path.join(root, '.build-cache/qa'), { recursive: true }); await page.screenshot({ path: path.join(root, '.build-cache/qa/product-cart.png') });
                    await page.click('[data-cart-close]'); await page.waitForFunction(() => document.querySelector('[data-cart-drawer]').getAttribute('aria-hidden') === 'true');
                    await page.waitForFunction(() => document.querySelector('[data-cart-drawer]').getBoundingClientRect().left >= innerWidth - 1);
                }
                else failures.push({ file, kind: 'interaction', message: 'No add-to-cart control found' });
            }
            if (file === 'admin.html') {
                await page.type('#admin-pw', 'synthetic-password'); await page.type('#admin-otp', '123456'); await page.click('#login-screen button');
                await page.waitForFunction(() => getComputedStyle(document.getElementById('dashboard')).display !== 'none');
                await page.click('[data-tab="orders"]'); await page.waitForFunction(() => document.getElementById('admin-order-list').textContent.includes('Barzahlung erfassen'));
                await page.evaluate(() => [...document.querySelectorAll('#admin-order-list button')].find(button => button.textContent === 'Barzahlung erfassen').click());
                await page.waitForSelector('dialog[open]'); await page.type('dialog input[type="number"]', '29.99'); await page.type('dialog input:not([type="number"])', 'TEST-RECEIPT');
                await page.click('dialog button'); await page.waitForFunction(() => !document.querySelector('dialog[open]'));
                assert.equal(order.paymentStatus, 'paid');
            }
            results.push({ file, ...layout });
            if (['index.html', 'product.html', 'admin.html', 'autoduft.html'].includes(file)) { await fs.mkdir(path.join(root, '.build-cache/qa'), { recursive: true }); await page.screenshot({ path: path.join(root, '.build-cache/qa', file.replace('.html', '.png')), fullPage: false }); }
            await page.close();
        }
        await fs.writeFile(path.join(root, '.build-cache/browser-results.json'), JSON.stringify({ results, failures, external }, null, 2));
        assert.deepEqual(failures, [], JSON.stringify(failures, null, 2));
        assert.deepEqual(external, [], 'No external resources before consent: ' + JSON.stringify(external));
    } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
