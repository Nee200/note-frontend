import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

test('Wrangler debug logs redact credentials and unknown response headers even with body sanitization disabled', { timeout: 45000 }, async t => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'note-wrangler-headers-'));
    const token = 'synthetic-fixture-api-token';
    const cookie = 'synthetic-fixture-cookie';
    const session = 'synthetic-fixture-session';
    const requests = [];
    const server = createServer((req, res) => {
        requests.push({ url: req.url, authorization: req.headers.authorization });
        res.writeHead(200, { 'content-type': 'application/json', 'set-cookie': `fixture=${cookie}`,
            'x-fixture-session': session, 'cf-ray': 'fixture-safe-header' });
        res.end(JSON.stringify({ success: true, errors: [], messages: [], result: { deployments: [] } }));
    });
    t.after(async () => {
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
        assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
        assert.ok(path.basename(root).startsWith('note-wrangler-headers-'));
        await fs.rm(root, { recursive: true, force: true });
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    // Start the installed CLI with a synthetic API and isolated configuration only.
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(path|systemroot|windir|temp|tmp)$/i.test(key)));
    Object.assign(env, { HOME: root, USERPROFILE: root, APPDATA: root, LOCALAPPDATA: root, XDG_CONFIG_HOME: root,
        CLOUDFLARE_API_BASE_URL: `http://127.0.0.1:${server.address().port}`,
        CLOUDFLARE_ACCOUNT_ID: '00000000000000000000000000000000', CLOUDFLARE_API_TOKEN: token,
        WRANGLER_SEND_METRICS: 'false', WRANGLER_LOG_PATH: path.join(root, 'logs'), WRANGLER_LOG: 'debug',
        WRANGLER_LOG_SANITIZE: 'false', CI: 'true', NO_COLOR: '1' });
    const cli = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
    const child = spawn(process.execPath, [cli, 'deployments', 'list', '--name', 'fixture', '--json'],
        { cwd: root, env, windowsHide: true });
    t.after(() => { if (child.exitCode === null) child.kill(); });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    const [code] = await once(child, 'close');
    assert.equal(code, 0, 'the synthetic deployment query must succeed');
    assert.equal(requests.length, 1, 'only the loopback deployment API should be called');
    assert.match(requests[0].url, /\/workers\/scripts\/fixture\/deployments$/);
    assert.equal(requests[0].authorization, `Bearer ${token}`, 'the request must still authenticate');
    const logFiles = await fs.readdir(path.join(root, 'logs'));
    assert.ok(logFiles.some(name => name.endsWith('.log')), 'the persisted debug log must also be checked');
    for (const name of logFiles) output += await fs.readFile(path.join(root, 'logs', name), 'utf8');
    assert.ok(output.includes('fixture-safe-header'), 'safe diagnostic response headers must remain useful');
    for (const value of [token, cookie, session]) assert.equal(output.includes(value), false, 'synthetic sensitive header leaked');
    assert.ok(output.includes('[REDACTED]'), 'sensitive headers must be explicitly redacted');
});
