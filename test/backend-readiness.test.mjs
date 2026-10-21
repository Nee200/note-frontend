import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkBackendReadiness } from '../backend-readiness.mjs';
import worker from '../worker.mjs';

test('scheduled readiness uses one uncached read-only request without credentials or redirects', async () => {
    let calls = 0;
    await checkBackendReadiness(async (url, options) => {
        calls++;
        assert.equal(url, 'https://note-backend-5gy0.onrender.com/ready');
        assert.equal(options.method, 'GET');
        assert.equal(options.redirect, 'manual');
        assert.equal(options.cache, 'no-store');
        assert.deepEqual(Object.keys(options.headers).sort(), ['Accept', 'Cache-Control', 'User-Agent']);
        assert.equal(options.body, undefined);
        assert.ok(options.signal instanceof AbortSignal);
        return Response.json({ status: 'ready' });
    });
    assert.equal(calls, 1);
});

test('readiness rejects loading pages, redirects, unhealthy payloads and network failures without leaking details', async () => {
    for (const response of [new Response('loading', { status: 503 }), new Response(null, { status: 302 }), new Response('<html>loading</html>'), Response.json({ status: 'not_ready' })]) {
        await assert.rejects(checkBackendReadiness(async () => response), /Backend readiness/);
    }
    await assert.rejects(checkBackendReadiness(async () => { throw Error('synthetic confidential upstream details'); }), error => {
        assert.equal(error.message, 'Backend readiness request failed or timed out.');
        return true;
    });
});

test('scheduled handler awaits the probe and reports failures to the cron platform', async t => {
    const logs = [];
    t.mock.method(console, 'log', value => logs.push(JSON.parse(value)));
    t.mock.method(console, 'error', value => logs.push(JSON.parse(value)));
    let healthy = true;
    t.mock.method(globalThis, 'fetch', async () => healthy ? Response.json({ status: 'ready' }) : new Response(null, { status: 503 }));
    await worker.scheduled({ scheduledTime: 1000 });
    assert.equal(logs[0].ok, true);
    healthy = false;
    await assert.rejects(worker.scheduled({ scheduledTime: 2000 }), /HTTP 503/);
    assert.equal(logs[1].ok, false);
    assert.equal(logs[1].scheduledTime, 2000);
});
