import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import worker from '../worker.mjs';
import { preview } from '../scripts/preview.mjs';

const config = { API_ORIGIN: 'https://synthetic-backend.example.test', PROXY_SHARED_SECRET: 'synthetic-shared-secret-at-least-32-bytes' };

test('API proxy preserves cookies/body and replaces forged forwarding headers with the trusted address', async t => {
    let forwarded;
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        forwarded = { url, ...options, text: await new Response(options.body).text() };
        const headers = new Headers({ 'Content-Type': 'application/json' });
        headers.append('Set-Cookie', 'auth_token=synthetic; HttpOnly; Secure; SameSite=Lax; Path=/');
        headers.append('Set-Cookie', 'csrf_token=synthetic; HttpOnly; Secure; SameSite=Lax; Path=/');
        return new Response('{"success":true}', { headers });
    });
    const request = new Request('https://shop.example.test/api/login?next=account', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://shop.example.test', Cookie: 'csrf_token=synthetic', 'CF-Connecting-IP': '192.0.2.1', 'X-Forwarded-For': '198.51.100.1', Forwarded: 'for=198.51.100.1', 'X-Note-Client-IP': '198.51.100.2', 'X-Note-Proxy-Secret': 'forged' }, body: '{"email":"synthetic@example.test"}' });
    const result = await worker.fetch(request, config);
    assert.equal(forwarded.url, config.API_ORIGIN + '/api/login?next=account');
    assert.equal(forwarded.headers.get('Host'), 'synthetic-backend.example.test');
    assert.equal(forwarded.headers.get('X-Note-Client-IP'), '192.0.2.1');
    assert.equal(forwarded.headers.get('X-Note-Proxy-Secret'), config.PROXY_SHARED_SECRET);
    assert.equal(forwarded.headers.get('X-Forwarded-For'), '192.0.2.1');
    assert.equal(forwarded.headers.get('Forwarded'), null);
    assert.equal(forwarded.headers.get('Origin'), 'https://shop.example.test');
    assert.equal(forwarded.headers.get('Cookie'), 'csrf_token=synthetic');
    assert.equal(forwarded.text, '{"email":"synthetic@example.test"}');
    assert.equal(result.headers.getSetCookie().length, 2);
    assert.equal(result.headers.get('Cache-Control'), 'private, no-store');
});

test('proxy fails closed on invalid configuration and returns a retryable error on upstream failure', async t => {
    const request = new Request('https://shop.example.test/api/products');
    for (const invalid of ['', 'not-a-url', 'http://example.test', 'https://user:secret@example.test', 'https://example.test/path', 'https://example.test/?query=1']) {
        assert.equal((await worker.fetch(request, { ...config, API_ORIGIN: invalid })).status, 503);
    }
    assert.equal((await worker.fetch(request, { ...config, PROXY_SHARED_SECRET: '' })).status, 503);
    t.mock.method(globalThis, 'fetch', async () => { throw Error('synthetic outage'); });
    const result = await worker.fetch(request, config);
    assert.equal(result.status, 503); assert.match(result.headers.get('Cache-Control'), /no-store/);
    assert.doesNotMatch(await result.text(), /synthetic outage/);
});

test('asset fallback redirects only manifest-owned entries and handles malformed URLs', async () => {
    const env = { ASSETS: { fetch: async request => new URL(request.url).pathname === '/asset-manifest.json' ? Response.json({ 'hero.webp': 'assets/synthetic.webp' }) : new Response('missing', { status: 404 }) } };
    assert.equal((await worker.fetch(new Request('https://shop.example.test/hero.webp'), env)).headers.get('Location'), 'https://shop.example.test/assets/synthetic.webp');
    assert.equal((await worker.fetch(new Request('https://shop.example.test/constructor'), env)).status, 404);
    assert.equal((await worker.fetch(new Request('https://shop.example.test/%E0%A4'), env)).status, 400);
});

test('published directory excludes source, business dumps and secrets, and caches only fingerprinted assets immutably', async () => {
    const server = await preview(0); const base = 'http://127.0.0.1:' + server.address().port;
    try {
        for (const file of ['.env', '.git/config', 'products.json', 'orders.json', 'README.md', 'package.json', 'worker.mjs', 'scripts/build.mjs', '_headers', '..%2fpackage.json']) {
            assert.equal((await fetch(base + '/' + file)).status, 404, file);
        }
        const html = await fetch(base + '/'); assert.equal(html.status, 200);
        assert.doesNotMatch(html.headers.get('Cache-Control'), /immutable/);
        const policy = html.headers.get('Content-Security-Policy').split(';').find(part => part.trim().startsWith('script-src'));
        assert.doesNotMatch(policy, /unsafe-inline|unsafe-eval/);
        const manifest = JSON.parse(await fs.readFile(new URL('../dist/asset-manifest.json', import.meta.url), 'utf8'));
        const image = await fetch(base + '/' + Object.values(manifest)[0]);
        assert.equal(image.status, 200); assert.match(image.headers.get('Cache-Control'), /immutable/);
    } finally { await new Promise(resolve => server.close(resolve)); }
});
