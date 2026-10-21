import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { Miniflare, Log, LogLevel } from 'miniflare';

test('the deployed scheduled handler reaches readiness in workerd and rejects redirects without following them', async () => {
    const config = JSON.parse(await fs.readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
    let mode = 'ready';
    let requests = 0;
    const runtime = new Miniflare({
        log: new Log(LogLevel.NONE),
        workers: [{
            config: {
                name: 'readiness-runtime',
                compatibilityDate: config.compatibility_date,
                manifest: {
                    mainModule: 'worker.mjs',
                    modules: Object.fromEntries(await Promise.all(['worker.mjs', 'backend-readiness.mjs', 'shop-features.mjs'].map(async name => [name, {
                        type: 'esm', contents: await fs.readFile(new URL('../' + name, import.meta.url), 'utf8')
                    }])))
                }
            },
            dev: { outboundService: { type: 'fetcher', handler: async request => {
            requests++;
            assert.equal(request.url, 'https://note-backend-5gy0.onrender.com/ready');
            assert.equal(request.method, 'GET');
            assert.equal(request.headers.get('authorization'), null);
            assert.equal(request.headers.get('cookie'), null);
            if (mode === 'redirect') return new Response(null, { status: 302, headers: { Location: 'https://unexpected.example.test/' } });
            if (mode === 'unavailable') return new Response('loading', { status: 503 });
            if (mode === 'invalid') return new Response('<html>loading</html>');
            return Response.json({ status: 'ready' });
            } } }
        }]
    });
    try {
        const scheduled = await runtime.getWorker();
        for (mode of ['ready', 'redirect', 'unavailable', 'invalid']) {
            requests = 0;
            const result = await scheduled.scheduled({ cron: '*/12 * * * *', scheduledTime: Date.now() });
            assert.equal(result.outcome, mode === 'ready' ? 'ok' : 'exception', mode);
            assert.equal(requests, 1, mode + ' must make exactly one request');
        }
    } finally { await runtime.dispose(); }
});
