import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import puppeteer from 'puppeteer';
import { preview } from '../scripts/preview.mjs';

test('published build proof binds the lockfile and actual build runtime', async () => {
    const meta = JSON.parse(await fs.readFile(new URL('../dist/security-build-info.json', import.meta.url), 'utf8'));
    const lock = await fs.readFile(new URL('../package-lock.json', import.meta.url));
    assert.equal(meta.schemaVersion, 1); assert.match(meta.commit, /^[a-f0-9]{40}$/);
    assert.equal(meta.lockSha256, crypto.createHash('sha256').update(lock).digest('hex'));
    assert.equal(meta.nodeVersion, process.versions.node);
});

test('admin security panel separates unknowns, stale findings and updates; escapes source data and handles queue failures on mobile', { timeout: 60000 }, async () => {
    const site = await preview(0);
    const browser = await puppeteer.launch({ headless: true, ...(process.platform === 'win32' ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : {}), args: process.platform === 'linux' ? ['--no-sandbox'] : [] });
    try {
        const page = await browser.newPage(), errors = [], writes = [];
        await page.setViewport({ width: 1440, height: 1050 });
        page.on('pageerror', error => errors.push(error.message));
        await page.evaluateOnNewDocument(() => localStorage.setItem('cookie_consent', 'necessary'));
        let queueStatus = 202, statusFailure = false;
        const security = { enabled: true, running: false, queued: false, scope: 'Testdaten: bekannte Befunde und nicht geprüfte Systeme.', sources: [
            { key: 'backend', label: 'Backend · npm', status: 'checked', checkedAt: '2026-10-21T08:00:00Z', findings: [], summary: 'Paketversionen geprüft.' },
            { key: 'github', label: 'GitHub · Codeprüfung', status: 'error', checkedAt: '2026-10-19T08:00:00Z', attemptedAt: '2026-10-21T08:00:00Z', isStale: true, error: 'Quelle nicht erreichbar.', findings: [{ id: 'CVE-synthetic', severity: 'high', title: '<img src=x onerror="window.__xss=1">', state: 'review', url: 'java\nscript:alert(1)' }], links: ['https://github.com/Nee200/note-backend/security'] },
            { key: 'frontend', label: 'Frontend · Updates', status: 'update', checkedAt: '2026-10-21T08:00:00Z', updates: [{ name: 'synthetic-build-tool', installed: '1.0.0', latest: '2.0.0', breaking: true }] },
            { key: 'mongo', label: 'MongoDB · Netzwerk', status: 'missing', isStale: true },
            { key: 'cloudflare', label: 'Cloudflare · Konfiguration', status: 'partial', checkedAt: '2026-10-21T08:00:00Z', gaps: ['Kontozugriff noch nicht geprüft.'] },
            { key: 'render', label: 'Render · HTTPS', status: 'checked', checkedAt: '2026-10-21T08:00:00Z', summary: 'Öffentliche Header geprüft.' }
        ] };
        await page.setRequestInterception(true);
        page.on('request', request => {
            const url = new URL(request.url());
            if (url.pathname.startsWith('/api/')) {
                const headers = { 'Access-Control-Allow-Origin': `http://127.0.0.1:${site.address().port}`, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type,x-csrf-token' };
                if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
                let body = {}, status = 200;
                if (request.method() !== 'GET') writes.push({ path: url.pathname, method: request.method() });
                if (url.pathname.endsWith('/admin/check')) body = { features: {} };
                else if (url.pathname.endsWith('/csrf-token')) body = { csrfToken: 'synthetic-csrf' };
                else if (url.pathname.endsWith('/products')) body = [];
                else if (url.pathname.endsWith('/security-status')) { status = statusFailure ? 500 : 200; body = { passed: 1, total: 1, updatedAt: '2026-10-21T08:00:00Z', scope: 'Test-Betriebszustand.', checks: [{ label: 'Datenbank', detail: 'Verbindung vorhanden', ok: true }], security }; }
                else if (url.pathname.endsWith('/security-scan')) { status = queueStatus; body = { accepted: status === 202 }; }
                return request.respond({ status, headers, contentType: 'application/json', body: JSON.stringify(body) });
            }
            if (!['127.0.0.1', 'localhost'].includes(url.hostname) && url.protocol !== 'data:') return request.abort();
            request.continue();
        });
        await page.goto(`http://127.0.0.1:${site.address().port}/admin.html`, { waitUntil: 'load' });
        await page.waitForSelector('#dashboard', { visible: true }); await page.click('[data-tab="monitoring"]');
        await page.waitForSelector('.security-source summary', { visible: true });
        assert.match(await page.$eval('#security-overview', el => el.textContent), /1 Meldungen · 1 verfügbare Updates · 3 Quellen/);
        // Initial status requests can replace this card while it is being clicked.
        await page.locator('[data-key="github"] summary').click();
        assert.equal(await page.$eval('[data-key="github"]', el => el.querySelectorAll('img,script').length), 0);
        assert.equal(await page.$eval('[data-key="github"]', el => el.querySelectorAll('a').length), 1);
        assert.equal(await page.evaluate(() => window.__xss), undefined);
        assert.match(await page.$eval('[data-key="github"]', el => el.textContent), /Letzter Versuch/);
        const qa = new URL('../.build-cache/qa/', import.meta.url); await fs.mkdir(qa, { recursive: true });
        await page.screenshot({ path: path.join(qa.pathname.replace(/^\/(\w:)/, '$1'), 'security-monitor-desktop.png'), fullPage: true });
        await page.setViewport({ width: 390, height: 844 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        await page.click('#run-all-checks-btn');
        await page.waitForFunction(() => document.getElementById('manual-check-status').textContent.includes('vorgemerkt'));
        queueStatus = 429;
        await page.click('#run-all-checks-btn');
        await page.waitForFunction(() => document.getElementById('manual-check-status').textContent.includes('15 Minuten'));
        statusFailure = true; queueStatus = 202;
        await page.click('#run-all-checks-btn');
        await page.waitForFunction(() => document.getElementById('manual-check-status').textContent.includes('nicht neu geladen'));
        assert.match(await page.$eval('#security-overview', el => el.textContent), /keine Entwarnung/);
        assert.deepEqual(writes, Array.from({ length: 3 }, () => ({ path: '/api/admin/security-scan', method: 'POST' })));
        assert.deepEqual(errors, []);
    } finally { await browser.close(); await new Promise(resolve => site.close(resolve)); }
});
