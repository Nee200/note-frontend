import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

// Exercise the actual Miniflare dependency, not Node's separately bundled fetch.
const fromMiniflare = createRequire(import.meta.resolve('miniflare'));
const { fetch: toolFetch } = fromMiniflare('undici');

test('Miniflare fetch enforces mixed-case SRI digests on local responses', async t => {
    const server = createServer((req, res) => res.end(req.url === '/correct' ? 'expected asset' : 'different asset'));
    server.listen(0, '127.0.0.1');
    t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
    await once(server, 'listening');
    const origin = `http://127.0.0.1:${server.address().port}`;
    const digest = createHash('sha256').update('expected asset').digest('base64');
    for (const algorithm of ['sha256', 'SHA256', 'Sha256']) {
        const integrity = `${algorithm}-${digest}`;
        assert.equal(await (await toolFetch(origin + '/correct', { integrity })).text(), 'expected asset');
        await assert.rejects(toolFetch(origin + '/wrong', { integrity }), /fetch failed/);
    }
});
