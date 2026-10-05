import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { preview } from '../scripts/preview.mjs';
import { entries, root } from '../scripts/build.mjs';

test('public pages provide a withdrawal link; mobile two-step form, retry, receipt download and admin handling work under CSP', { timeout: 60000 }, async () => {
    for (const file of entries.filter(name => name !== 'admin.html')) {
        const html = await fs.readFile(path.join(root, 'dist', file), 'utf8');
        assert.match(html, /href="widerruf.html" class="withdrawal-link">Vertrag widerrufen/, file);
    }
    const server = await preview(0); let browser;
    const requests = [], errors = [], statusWrites = [];
    const record = { _id: '0123456789abcdef01234567', reference: 'WR-SYNTHETIC', receivedAt: '2026-10-05T12:00:00.000Z', name: '<script>Synthetic</script>', email: 'synthetic@example.test', contract: 'Bestellung am 1. Oktober: G1', scope: 'partial', items: '1 × G1, 50 ml', declaration: 'Hiermit widerrufe ich den angegebenen Vertrag hinsichtlich der unten genannten Artikel.', status: 'received', mailStatus: { customer: 'manual_review', operator: 'accepted' } };
    try {
        const chrome = process.env.PUPPETEER_EXECUTABLE_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);
        browser = await puppeteer.launch({ headless: true, ...(chrome ? { executablePath: chrome } : {}), args: process.platform === 'linux' ? ['--no-sandbox'] : [] });
        const page = await browser.newPage(); await page.setViewport({ width: 390, height: 844 });
        await page.evaluateOnNewDocument(() => { localStorage.setItem('cookie_consent', 'necessary'); });
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (/Refused to|Content Security Policy|Executing inline/.test(message.text())) errors.push(message.text()); });
        await page.setRequestInterception(true);
        page.on('request', request => {
            const url = new URL(request.url());
            if (url.pathname.startsWith('/api/')) {
                const headers = { 'Access-Control-Allow-Origin': 'http://127.0.0.1:' + server.address().port, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type, x-csrf-token' };
                if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
                let body = {}, status = 200;
                if (url.pathname === '/api/csrf-token') body = { csrfToken: 'synthetic-csrf' };
                else if (url.pathname === '/api/withdrawals') {
                    assert.equal(request.headers()['x-csrf-token'], 'synthetic-csrf');
                    requests.push(JSON.parse(request.postData()));
                    if (requests.length === 1) { status = 503; body = { error: 'Synthetischer Verbindungsfehler' }; }
                    else body = { success: true, emailStatus: 'pending', receipt: { ...record, ...requests.at(-1), requestId: undefined } };
                }
                else if (url.pathname === '/api/admin/check') body = { success: true, features: { invoices: false } };
                else if (url.pathname === '/api/admin/withdrawals') body = { withdrawals: [record], page: 1, hasMore: false };
                else if (url.pathname.endsWith('/status')) { statusWrites.push(JSON.parse(request.postData())); body = { success: true }; }
                else if (url.pathname === '/api/admin/security-status') body = { checks: [], monitor: { alerts: [], history: [] } };
                else if (url.pathname === '/api/products') body = [];
                else if (url.pathname === '/api/user') { status = 401; body = { error: 'Nicht angemeldet' }; }
                return request.respond({ status, contentType: 'application/json', headers, body: JSON.stringify(body) });
            }
            if (['http:', 'https:'].includes(url.protocol) && !['127.0.0.1', 'localhost'].includes(url.hostname)) return request.abort();
            return request.continue();
        });
        const base = 'http://127.0.0.1:' + server.address().port;
        await page.goto(base + '/widerruf.html', { waitUntil: 'networkidle0' });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        assert.equal(await page.$('#nl-popup'), null, 'No marketing popup should interrupt a withdrawal');
        await page.type('#withdrawal-name', 'Synthetic Customer'); await page.type('#withdrawal-email', 'synthetic@example.test'); await page.type('#withdrawal-contract', record.contract);
        await page.click('input[value="partial"]'); await page.type('#withdrawal-items', record.items);
        await page.click('#withdrawal-form button');
        assert.equal(requests.length, 0, 'Review alone must not submit a declaration');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'withdrawal-review-title');
        assert.ok((await page.$eval('#withdrawal-review-details', node => node.textContent)).includes(record.items));
        await page.click('#withdrawal-edit'); assert.equal(await page.$eval('#withdrawal-items', node => node.value), record.items);
        await page.click('#withdrawal-form button'); await page.click('#withdrawal-confirm'); await page.waitForFunction(() => !document.getElementById('withdrawal-error').hidden);
        await page.click('#withdrawal-confirm'); await page.waitForFunction(() => !document.getElementById('withdrawal-success').hidden);
        assert.equal(requests.length, 2); assert.deepEqual(requests[0], requests[1]);
        assert.ok((await page.$eval('#withdrawal-mail-message', node => node.textContent)).includes('steht noch aus'));
        assert.equal(await page.evaluate(() => document.activeElement.id), 'withdrawal-success-title');
        await page.evaluate(() => { const original = URL.createObjectURL; URL.createObjectURL = blob => { blob.text().then(text => { window.syntheticDownload = text; }); return original(blob); }; });
        await page.click('#withdrawal-download'); await page.waitForFunction(() => window.syntheticDownload);
        const download = await page.evaluate(() => window.syntheticDownload);
        for (const value of [record.reference, record.receivedAt, record.contract, record.items, 'Synthetic Customer', 'synthetic@example.test']) assert.ok(download.includes(value), value);
        await fs.mkdir(path.join(root, '.build-cache/qa'), { recursive: true });
        await page.screenshot({ path: path.join(root, '.build-cache/qa/withdrawal-mobile-receipt.png'), fullPage: true });
        await page.setViewport({ width: 1366, height: 900 }); await page.goto(base + '/widerruf.html', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(root, '.build-cache/qa/withdrawal-desktop.png'), fullPage: true });
        await page.goto(base + '/admin.html', { waitUntil: 'networkidle0' });
        await page.waitForFunction(() => getComputedStyle(document.getElementById('dashboard')).display !== 'none');
        await page.click('[data-tab="withdrawals"]'); await page.waitForSelector('.withdrawal-admin-card');
        assert.equal(await page.$('.withdrawal-admin-card script'), null); assert.ok((await page.$eval('#admin-withdrawal-list', node => node.textContent)).includes(record.name));
        assert.ok((await page.$eval('#admin-withdrawal-list', node => node.textContent)).includes('Providerstatus manuell prüfen'));
        await page.select('.withdrawal-admin-card select', 'processing'); await page.click('.withdrawal-admin-card button'); await page.waitForFunction(() => document.querySelector('.withdrawal-admin-card form p').textContent === 'Status gespeichert.');
        assert.deepEqual(statusWrites, [{ status: 'processing' }]);
        assert.deepEqual(errors, []);
    } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
