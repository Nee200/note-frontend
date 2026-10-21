import { test } from 'node:test';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { preview } from '../scripts/preview.mjs';

async function fixture(t, confirmStatus = 201) {
    const site = await preview(0);
    const browser = await puppeteer.launch({ headless: true,
        ...(process.platform === 'win32' ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : {}),
        args: process.platform === 'linux' ? ['--no-sandbox'] : []
    });
    t.after(async () => { await browser.close(); await new Promise(resolve => site.close(resolve)); });
    const origin = `http://127.0.0.1:${site.address().port}`, page = await browser.newPage();
    const writes = [], errors = [], external = [];
    let authenticated = false;
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.evaluateOnNewDocument(() => localStorage.setItem('cookie_consent', 'necessary'));
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
        if (message.type() === 'error' && /Content Security|Refused to|Executing inline|blocked/i.test(message.text())) errors.push(message.text());
    });
    await page.setRequestInterception(true);
    page.on('request', request => {
        const url = new URL(request.url());
        if (url.pathname.startsWith('/api/')) {
            const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type,x-csrf-token' };
            if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
            let status = 200, body = {};
            if (request.method() === 'POST') writes.push({ path: url.pathname, body: JSON.parse(request.postData()) });
            if (url.pathname === '/api/csrf-token') body = { csrfToken: 'synthetic-registration-csrf' };
            else if (url.pathname === '/api/register') { status = 202; body = { success: true, message: 'Prüfe dein E-Mail-Postfach für die nächsten Schritte.' }; }
            else if (url.pathname === '/api/register/confirm') {
                status = confirmStatus;
                if (status === 201) { authenticated = true; body = { success: true }; }
                else body = { error: status === 409 ? 'Du hast bereits ein Konto. Bitte melde dich an oder nutze „Passwort vergessen“.' : 'Der Link ist ungültig oder abgelaufen. <img src=x onerror=alert(1)>' };
            }
            else if (url.pathname === '/api/user') {
                status = authenticated ? 200 : 401;
                body = authenticated ? { user: { name: 'Synthetic owner', email: 'owner@example.test', emailVerified: true, addresses: [] } } : { error: 'Nicht angemeldet' };
            }
            else if (url.pathname === '/api/products') body = [];
            else if (url.pathname === '/api/user/orders') body = { orders: [], page: 1, hasMore: false };
            else if (url.pathname === '/api/commerce-config') body = { shippingCents: 699, freeShippingThresholdCents: 6000, countries: ['DE'] };
            return request.respond({ status, headers, contentType: 'application/json', body: JSON.stringify(body) });
        }
        if (['http:', 'https:'].includes(url.protocol) && !['127.0.0.1', 'localhost'].includes(url.hostname)) {
            external.push(url.origin + url.pathname);
            return request.abort();
        }
        return request.continue();
    });
    return { page, origin, writes, errors, external };
}

test('mobile registration requests a mailbox link, then confirms once with the owner password and reaches the account', { timeout: 60000 }, async t => {
    const { page, origin, writes, errors, external } = await fixture(t);
    await page.goto(origin + '/account.html', { waitUntil: 'load' });
    await page.waitForSelector('#auth-section', { visible: true });
    await page.click('.register-link-wrap a');
    await page.waitForSelector('#register-form', { visible: true });
    assert.equal(await page.$('#register-password'), null, 'the public registration request must not choose a password');
    await page.type('#register-name', 'Synthetic owner');
    await page.type('#register-email', 'owner@example.test');
    await page.click('#register-form button[type="submit"]');
    await page.waitForFunction(() => document.getElementById('register-success')?.textContent.includes('E-Mail-Postfach'));
    assert.deepEqual(writes, [{ path: '/api/register', body: { name: 'Synthetic owner', email: 'owner@example.test' } }]);
    assert.equal(new URL(page.url()).pathname, '/account.html');
    assert.equal(await page.$eval('#dashboard-section', element => getComputedStyle(element).display), 'none');
    assert.equal(await page.$eval('#register-form button', element => element.disabled), false);

    const token = 'a'.repeat(64);
    await page.goto(origin + '/account.html?returnTo=' + encodeURIComponent('/account.html?registered=1') + '#register=' + token, { waitUntil: 'load' });
    await page.waitForSelector('#registration-confirm-form', { visible: true });
    await page.type('#registration-password', 'short');
    await page.click('#registration-confirm-form button');
    assert.equal(writes.some(write => write.path === '/api/register/confirm'), false, 'native password constraints reject an incomplete password');
    await page.$eval('#registration-password', element => { element.value = 'synthetic-owner-password-123'; });
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.click('#registration-confirm-form button')
    ]);
    await page.waitForSelector('#dashboard-section', { visible: true });
    assert.deepEqual(writes.filter(write => write.path === '/api/register/confirm'), [{ path: '/api/register/confirm', body: { token, password: 'synthetic-owner-password-123' } }]);
    assert.equal(new URL(page.url()).origin, origin);
    assert.equal(new URL(page.url()).search, '?registered=1');
    assert.equal(new URL(page.url()).hash, '', 'the one-time token is removed from the URL after success');
    assert.equal(await page.$('#registration-confirm-form'), null);
    assert.match(await page.$eval('#account-verification', element => element.textContent), /Gastbestellungen zuordnen/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
});

for (const status of [400, 409]) {
    test(`registration confirmation error ${status} stays on the account page and preserves a usable login form`, { timeout: 60000 }, async t => {
        const { page, origin, writes, errors, external } = await fixture(t, status);
        await page.goto(origin + '/account.html#register=' + 'b'.repeat(64), { waitUntil: 'load' });
        await page.waitForSelector('#registration-confirm-form', { visible: true });
        await page.type('#registration-password', 'synthetic-owner-password-123');
        await page.click('#registration-confirm-form button');
        await page.waitForFunction(() => document.querySelector('#registration-confirm-form [role="status"]')?.textContent.length > 0);
        const message = await page.$eval('#registration-confirm-form [role="status"]', element => element.textContent);
        assert.match(message, status === 409 ? /bereits ein Konto/ : /ungültig oder abgelaufen/);
        assert.equal(await page.$('#registration-confirm-form [role="status"] img'), null, 'server errors are rendered as text');
        assert.equal(await page.$eval('#registration-confirm-form button', element => element.disabled), false);
        await page.waitForSelector('#login-form', { visible: true });
        assert.equal(new URL(page.url()).origin, origin);
        assert.equal(await page.$eval('#dashboard-section', element => getComputedStyle(element).display), 'none');
        assert.equal(writes.length, 1);
        assert.deepEqual(errors, []);
        assert.deepEqual(external, []);
    });
}
