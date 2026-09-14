import { test } from 'node:test';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { preview } from '../scripts/preview.mjs';

test('admin enrollment UI keeps the dashboard locked, resumes MFA and exposes invitation controls only after login', { timeout: 60000 }, async () => {
    const site = await preview(0);
    const browser = await puppeteer.launch({ headless: true, ...(process.platform === 'win32' ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : {}), args: process.platform === 'linux' ? ['--no-sandbox'] : [] });
    try {
        const page = await browser.newPage(), errors = [], writes = [];
        let step = null, loggedIn = false;
        const mfa = { step: 'mfa', secret: 'SYNTHETICSETUPKEY', qr: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=' };
        await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
        page.on('pageerror', error => errors.push(error.message));
        await page.evaluateOnNewDocument(() => localStorage.setItem('cookie_consent', 'necessary'));
        await page.setRequestInterception(true);
        page.on('request', request => {
            const url = new URL(request.url());
            if (url.pathname.startsWith('/api/')) {
                const headers = { 'Access-Control-Allow-Origin': `http://127.0.0.1:${site.address().port}`, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type,x-csrf-token' };
                if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
                let body = {}, status = 200;
                if (request.method() === 'POST') writes.push(url.pathname);
                if (url.pathname.endsWith('/csrf-token')) body = { csrfToken: 'synthetic-csrf' };
                else if (url.pathname.endsWith('/admin/check')) { status = loggedIn ? 200 : 401; body = loggedIn ? { features: {} } : { error: 'Not logged in' }; }
                else if (url.pathname.endsWith('/admin/login')) { step = 'password'; body = { setupRequired: true, step }; }
                else if (url.pathname.endsWith('/admin/setup/password')) { step = 'mfa'; body = mfa; }
                else if (url.pathname.endsWith('/admin/setup/confirm')) { if (JSON.parse(request.postData()).otp === '123456') { loggedIn = true; step = null; body = { success: true }; } else { status = 400; body = { error: 'Code ungültig' }; } }
                else if (url.pathname.endsWith('/admin/setup')) { status = step ? 200 : 401; body = step === 'mfa' ? mfa : { step }; }
                else if (url.pathname.endsWith('/admin/access/invite')) body = { username: 'betreiber', oneTimePassword: 'synthetic-invite-password', expiresAt: new Date(Date.now()+86400000).toISOString() };
                else if (url.pathname.endsWith('/admin/access')) body = { accounts: [{ username: 'betreiber', status: 'invited' }] };
                else if (url.pathname.endsWith('/products')) body = [];
                return request.respond({ status, headers, contentType: 'application/json', body: JSON.stringify(body) });
            }
            if (!['127.0.0.1','localhost'].includes(url.hostname) && url.protocol !== 'data:') return request.abort();
            return request.continue();
        });
        await page.goto(`http://127.0.0.1:${site.address().port}/admin.html`, { waitUntil: 'load' });
        await page.type('#admin-pw', 'synthetic-one-time-password');
        await page.click('#admin-login-fields button');
        await page.waitForSelector('#setup-password-form:not([hidden])');
        assert.equal(await page.$eval('#dashboard', item => getComputedStyle(item).display), 'none');
        await page.type('#setup-password', 'my-new-synthetic-password');
        await page.type('#setup-password-repeat', 'does-not-match-this');
        await page.click('#setup-password-form button');
        await page.waitForSelector('#setup-error:not([hidden])');
        assert.equal(writes.includes('/api/admin/setup/password'), false);
        await page.$eval('#setup-password-repeat', input => { input.value = 'my-new-synthetic-password'; });
        await page.click('#setup-password-form button');
        await page.waitForSelector('#setup-mfa-form:not([hidden])');
        assert.equal(await page.$eval('#setup-password', input => input.value), '');
        await page.reload({ waitUntil: 'load' });
        await page.waitForSelector('#setup-mfa-form:not([hidden])');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1), true);
        await page.type('#setup-otp', '000000'); await page.click('#setup-mfa-form button');
        await page.waitForSelector('#setup-error:not([hidden])');
        assert.equal(await page.$eval('#dashboard', item => getComputedStyle(item).display), 'none');
        await page.$eval('#setup-otp', input => { input.value = '123456'; });
        await page.click('#setup-mfa-form button');
        await page.waitForFunction(() => getComputedStyle(document.querySelector('#dashboard')).display === 'block');
        assert.equal(await page.$eval('#setup-secret', item => item.textContent), '');
        await page.setViewport({ width: 1366, height: 900 });
        await page.click('[data-tab="access"]');
        await page.waitForSelector('#access-invite-form', { visible: true });
        await page.click('#access-invite-form button');
        await page.waitForSelector('#access-invitation:not([hidden])');
        assert.match(await page.$eval('#access-invitation-text', item => item.value), /synthetic-invite-password/);
        assert.deepEqual(errors, []);
    } finally { await browser.close(); await new Promise(resolve => site.close(resolve)); }
});
