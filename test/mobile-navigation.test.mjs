import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { preview } from '../scripts/preview.mjs';

const categories = ['frauenduefte', 'herrenduefte', 'autoduft', 'duftroller'];

async function fixture(t) {
    const server = await preview(0);
    const origin = `http://127.0.0.1:${server.address().port}`;
    const browser = await puppeteer.launch({ headless: true,
        ...(process.platform === 'win32' ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : {}),
        args: process.platform === 'linux' ? ['--no-sandbox'] : [] });
    t.after(async () => { await browser.close(); await new Promise(resolve => server.close(resolve)); });
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.evaluateOnNewDocument(() => localStorage.setItem('cookie_consent', 'necessary'));
    await page.setRequestInterception(true);
    page.on('request', request => {
        const url = new URL(request.url());
        if (url.pathname.startsWith('/api/')) {
            let body = {}, status = 200;
            if (url.pathname === '/api/products') body = [];
            else if (url.pathname === '/api/user') { status = 401; body = { error: 'Nicht angemeldet' }; }
            else if (url.pathname === '/api/commerce-config') body = { shippingCents: 699, freeShippingThresholdCents: 6000, countries: ['DE'] };
            else if (url.pathname.endsWith('/reviews')) body = { reviews: [], summary: { average: 0, count: 0 } };
            return request.respond({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true' }, body: JSON.stringify(body) });
        }
        if (url.origin !== origin) return request.abort();
        return request.continue();
    });
    async function openMenu(file = 'index.html') {
        await page.goto(`${origin}/${file}`, { waitUntil: 'networkidle0' });
        await page.tap('[data-mobile-menu-toggle]');
        await page.waitForFunction(() => {
            const nav = document.querySelector('#main-navigation');
            return nav.classList.contains('is-open') && nav.getAnimations().every(a => a.playState !== 'running');
        });
        await page.tap('.nav-fragrances > summary');
    }
    async function followCategory(slug) {
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }),
            page.tap(`.nav-fragrances-panel a[href="${slug}.html"]`)
        ]);
        assert.equal(new URL(page.url()).pathname, `/${slug}.html`, `Touching ${slug} must open that category`);
    }
    return { page, openMenu, followCategory };
}

test('all fragrance links respond to touch immediately after opening the mobile submenu', { timeout: 60000 }, async t => {
    const { page, openMenu, followCategory } = await fixture(t);
    for (const slug of [...categories].reverse()) {
        await openMenu();
        await followCategory(slug);
    }
    for (const [width, height] of [[320, 568], [844, 390], [1024, 768]]) {
        await page.setViewport({ width, height, isMobile: true, hasTouch: true });
        await openMenu('duftroller.html');
        await followCategory('autoduft');
        await openMenu('autoduft.html');
        await followCategory('duftroller');
    }
});

test('a touch that does not transfer focus can still activate the fragrance link', { timeout: 30000 }, async t => {
    const { page, openMenu, followCategory } = await fixture(t);
    await openMenu();
    // Some touch browsers blur the summary without focusing the link. Keep the
    // pointer/click sequence real while reproducing that focus behavior.
    await page.evaluate(() => {
        document.querySelector('.nav-fragrances > summary').focus();
        document.querySelector('.nav-fragrances-panel').addEventListener('pointerdown', event => {
            event.preventDefault();
            document.activeElement.blur();
        }, { once: true });
    });
    await followCategory('duftroller');
});

test('keyboard, outside click and menu close still dismiss the fragrance submenu', { timeout: 30000 }, async t => {
    const { page, openMenu } = await fixture(t);
    await openMenu();
    await page.tap('[data-mobile-menu-toggle]');
    assert.equal(await page.$eval('#main-navigation', nav => nav.classList.contains('is-open')), false);
    assert.equal(await page.$eval('.nav-fragrances', node => node.open), false);

    await page.setViewport({ width: 1440, height: 900, isMobile: false, hasTouch: false });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.click('.nav-fragrances > summary');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('href')), 'frauenduefte.html');
    assert.equal(await page.$eval('.nav-fragrances', node => node.open), true);
    for (let i = 0; i < categories.length; i++) await page.keyboard.press('Tab');
    assert.equal(await page.$eval('.nav-fragrances', node => node.open), false);
    await page.click('.nav-fragrances > summary');
    await page.keyboard.press('Escape');
    assert.equal(await page.$eval('.nav-fragrances', node => node.open), false);
    await page.click('.nav-fragrances > summary');
    await page.click('h1');
    await page.waitForFunction(() => !document.querySelector('.nav-fragrances').open);

    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await openMenu();
    await page.waitForFunction(() => {
        const link = document.querySelector('.nav-fragrances-panel a[href="duftroller.html"]');
        const r = link.getBoundingClientRect();
        return link.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2))
            && getComputedStyle(link.parentElement).opacity === '1';
    });
    const dir = path.resolve('.build-cache/qa');
    await fs.mkdir(dir, { recursive: true });
    await page.screenshot({ path: path.join(dir, 'mobile-navigation.png') });
});
