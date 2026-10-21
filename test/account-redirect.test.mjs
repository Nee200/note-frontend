import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import vm from 'node:vm';
import puppeteer from 'puppeteer';

const source = await fs.readFile(new URL('../account.js', import.meta.url), 'utf8');
const productionOrigin = 'https://www.note-fragrances.de';

function accountUrl(origin, returnTo) {
    const url = new URL('/account.html', origin);
    if (returnTo !== undefined) url.searchParams.set('returnTo', returnTo);
    return url.href;
}

function resolveReturnUrl(returnTo) {
    // Execute the complete application source, without firing DOM events or
    // contacting an API. The URL helper itself is not copied into the test.
    const location = new URL(accountUrl(productionOrigin, returnTo));
    const context = vm.createContext({
        URL,
        URLSearchParams,
        window: { location, addEventListener() {} },
        document: { addEventListener() {} }
    });
    vm.runInContext(source, context, { filename: 'account.js' });
    return vm.runInContext('getSafeReturnUrl()', context);
}

test('login return URLs reject foreign origins, credentials and unsafe schemes after URL parsing', () => {
    const rejected = [
        undefined,
        '',
        'https://evil.example/login',
        'HTTPS://EVIL.EXAMPLE/login',
        'http:evil.example/login',
        'http:/evil.example/login',
        'http://www.note-fragrances.de/cart.html',
        '//evil.example/login',
        '///evil.example/login',
        '////evil.example/login',
        String.raw`\\evil.example\login`,
        String.raw`/\evil.example/login`,
        String.raw`\/evil.example/login`,
        String.raw`https:\\evil.example\login`,
        ' \t//evil.example/login\r\n',
        'https:\n//evil.example/login',
        '//ev\til.example/login',
        'https://www.note-fragrances.de.evil.example/login',
        'https://www.note-fragrances.de@evil.example/login',
        'https://evil.example@www.note-fragrances.de/cart.html',
        'https://user:password@www.note-fragrances.de/cart.html',
        '//user@www.note-fragrances.de/cart.html',
        'https://www.note-fragrances.de:444/cart.html',
        'https://note-fragrances.de/cart.html',
        'https://www.note-fragrances.de./cart.html',
        'https://www.note-fragrances.de%2fevil.example/login',
        'https://[invalid]/',
        'javascript:alert(1)',
        'JaVaScRiPt:alert(1)',
        'java\nscript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'blob:https://www.note-fragrances.de/synthetic',
        'file:///C:/Windows/system.ini',
        'ftp://www.note-fragrances.de/cart.html',
        'mailto:user@example.com',
        'about:blank'
    ];
    for (const value of rejected) {
        assert.equal(resolveReturnUrl(value), null, `must reject ${JSON.stringify(value)}`);
    }
});

test('login return URLs preserve normal shop destinations as absolute URLs', () => {
    const cases = [
        ['/cart.html', `${productionOrigin}/cart.html`],
        ['cart.html', `${productionOrigin}/cart.html`],
        ['./cart.html?coupon=NOTE-TEST#checkout', `${productionOrigin}/cart.html?coupon=NOTE-TEST#checkout`],
        ['../cart.html', `${productionOrigin}/cart.html`],
        ['/shop.html?category=women&query=Rose%20Wood', `${productionOrigin}/shop.html?category=women&query=Rose%20Wood`],
        [`${productionOrigin}/cart.html`, `${productionOrigin}/cart.html`],
        ['HTTPS://WWW.NOTE-FRAGRANCES.DE:443/cart.html', `${productionOrigin}/cart.html`],
        ['//www.note-fragrances.de/cart.html', `${productionOrigin}/cart.html`],
        ['https:evil.example/login', `${productionOrigin}/evil.example/login`],
        ['https:/evil.example/login', `${productionOrigin}/evil.example/login`],
        [`${productionOrigin}//evil.example/login`, `${productionOrigin}//evil.example/login`],
        ['//www.note-fragrances.de//evil.example/login', `${productionOrigin}//evil.example/login`],
        ['/%2F%2Fevil.example/login', `${productionOrigin}/%2F%2Fevil.example/login`],
        ['/cart.html?next=https://evil.example/', `${productionOrigin}/cart.html?next=https://evil.example/`],
        ['/schöne-düfte', `${productionOrigin}/sch%C3%B6ne-d%C3%BCfte`],
        ['/cart.html#bestellung', `${productionOrigin}/cart.html#bestellung`]
    ];
    for (const [value, expected] of cases) {
        assert.equal(resolveReturnUrl(value), expected, `must preserve ${JSON.stringify(value)}`);
    }
});

async function browserFixture(t) {
    const server = http.createServer((request, response) => {
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.end('<!doctype html><html><head><title>Isolated account redirect test</title></head><body></body></html>');
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    let browser;
    t.after(async () => {
        await browser?.close();
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
    });
    const origin = `http://127.0.0.1:${server.address().port}`;
    browser = await puppeteer.launch({
        headless: true,
        ...(process.platform === 'win32' ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : {}),
        args: process.platform === 'linux' ? ['--no-sandbox'] : []
    });
    const page = await browser.newPage();
    const externalRequests = [];
    await page.setRequestInterception(true);
    page.on('request', request => {
        if (new URL(request.url()).origin !== origin) {
            externalRequests.push(request.url());
            return request.abort();
        }
        return request.continue();
    });
    async function load(returnTo) {
        await page.goto(accountUrl(origin, returnTo), { waitUntil: 'load' });
        // Loading after DOMContentLoaded makes this a test of the real helpers
        // without logging in, creating an account, or making any API request.
        await page.addScriptTag({ content: source });
    }
    return { origin, page, externalRequests, load };
}

test('Chromium refuses external login redirects without starting navigation', { timeout: 60000 }, async t => {
    const { page, origin, externalRequests, load } = await browserFixture(t);
    const blocked = [
        'https:evil.example/fake-login',
        'https:/evil.example/fake-login',
        '//evil.example/fake-login',
        String.raw`/\evil.example/fake-login`,
        String.raw`\\evil.example\fake-login`,
        'javascript:window.redirectExecuted=true',
        origin.replace('://', '://user:password@') + '/cart.html'
    ];
    for (const value of blocked) {
        await load(value);
        const before = page.url();
        const result = await page.evaluate(() => ({ safe: getSafeReturnUrl(), redirected: redirectAfterAuth() }));
        assert.deepEqual(result, { safe: null, redirected: false }, value);
        assert.equal(page.url(), before, value);
    }
    assert.deepEqual(externalRequests, []);
});

test('Chromium follows valid shop destinations and keeps double-slash paths on the shop origin', { timeout: 60000 }, async t => {
    const { page, origin, externalRequests, load } = await browserFixture(t);
    const cases = [
        ['/cart.html?source=login#checkout', `${origin}/cart.html?source=login#checkout`],
        ['duftroller.html?duft=G369', `${origin}/duftroller.html?duft=G369`],
        [`${origin}//evil.example/fake-login`, `${origin}//evil.example/fake-login`],
        [`//${new URL(origin).host}//evil.example/fake-login`, `${origin}//evil.example/fake-login`],
        ['/%2F%2Fevil.example/fake-login', `${origin}/%2F%2Fevil.example/fake-login`]
    ];
    for (const [value, expected] of cases) {
        await load(value);
        assert.equal(await page.evaluate(() => getSafeReturnUrl()), expected);
        const [, redirected] = await Promise.all([
            page.waitForNavigation({ waitUntil: 'load', timeout: 10000 }),
            page.evaluate(() => redirectAfterAuth())
        ]);
        assert.equal(redirected, true, value);
        assert.equal(page.url(), expected, value);
        assert.equal(new URL(page.url()).origin, origin, value);
    }
    assert.deepEqual(externalRequests, []);
});
