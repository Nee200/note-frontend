import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { unstable_generateASSETSBinding } from '../node_modules/wrangler/wrangler-dist/cli.js';

const cli = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));

async function fixture(t) {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'note-pages-security-'));
    t.after(async () => {
        assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
        assert.ok(path.basename(root).startsWith('note-pages-security-'));
        await fs.rm(root, { recursive: true, force: true });
    });
    return root;
}

test('Pages asset lookup cannot read neighboring names that share the public directory prefix', async t => {
    const root = await fixture(t);
    const directory = path.join(root, 'public');
    await fs.mkdir(directory);
    await fs.mkdir(path.join(root, 'public-neighbor'));
    await fs.writeFile(path.join(root, 'public-neighbor/message.txt'), 'synthetic-outside-directory');
    await fs.writeFile(path.join(root, 'public.txt'), 'synthetic-outside-file');
    await fs.writeFile(path.join(directory, '404.html'), 'fixture-not-found');
    await fs.writeFile(path.join(directory, 'message.txt'), 'public-message');
    await fs.writeFile(path.join(directory, '..notes.txt'), 'public-two-dot-name');
    const controller = new AbortController();
    const noop = () => {};
    const assets = await unstable_generateASSETSBinding({ directory, signal: controller.signal,
        log: { debug: noop, info: noop, log: noop, warn: noop, error: noop } });
    try {
        // Exercise the installed helper used by Pages dev and the Vitest ASSETS binding.
        for (const [name, value] of [['message.txt', 'public-message'], ['..notes.txt', 'public-two-dot-name']]) {
            const response = await assets(new Request('https://fixture.example/' + name));
            assert.equal(response.status, 200);
            assert.equal(await response.text(), value);
        }
        for (const pathname of [
            '/..%2fpublic-neighbor/message.txt', '/%2e%2e%2fpublic-neighbor%2fmessage.txt',
            '/nested%2f..%2f..%2fpublic-neighbor/message.txt', '/%2e%2e%2fpublic.txt',
            '/%2e%2e%5cpublic-neighbor%5cmessage.txt', '/%2e%2e%5cpublic.txt'
        ]) {
            await t.test(pathname, async () => {
                const response = await assets(new Request('https://fixture.example' + pathname));
                assert.equal(response.status, 404, 'neighboring paths must use the configured not-found response');
                assert.equal(await response.text(), 'fixture-not-found');
            });
        }
    } finally { controller.abort(); }
});

test('compiled Pages middleware protects repeated-slash paths and preserves allowed requests', async t => {
    const root = await fixture(t);
    const functions = path.join(root, 'functions');
    await fs.mkdir(path.join(functions, 'secure/nested'), { recursive: true });
    await fs.writeFile(path.join(functions, 'secure/nested/_middleware.js'), `
        export async function onRequest({ request, functionPath, next }) {
            if (request.headers.get('x-fixture-allow') !== 'yes') return new Response('denied', { status: 403 });
            const response = await next();
            response.headers.set('x-fixture-path', functionPath);
            response.headers.set('x-fixture-url', request.url);
            return response;
        }
    `);
    const outdir = path.join(root, 'compiled');
    await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({ type: 'module' }));
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(path|systemroot|windir|temp|tmp)$/i.test(key)));
    Object.assign(env, { USERPROFILE: root, APPDATA: root, LOCALAPPDATA: root, XDG_CONFIG_HOME: root,
        WRANGLER_SEND_METRICS: 'false', WRANGLER_LOG_PATH: path.join(root, 'logs'), CI: 'true', NO_COLOR: '1' });
    // Build synthetic functions only: no login, deployment, credentials or network service.
    const built = spawnSync(process.execPath, [cli, 'pages', 'functions', 'build', functions, '--outdir', outdir,
        '--project-directory', root, '--compatibility-date', '2026-09-02'],
        { cwd: root, env, encoding: 'utf8', timeout: 30000, windowsHide: true });
    assert.ifError(built.error);
    assert.equal(built.status, 0, built.stdout + built.stderr);
    const modules = (await fs.readdir(outdir)).filter(name => /\.m?js$/.test(name));
    assert.equal(modules.length, 1, 'the synthetic fixture must produce one self-contained worker');
    const workerPath = path.join(outdir, modules[0]);
    const { default: worker } = await import(pathToFileURL(workerPath));
    const context = { waitUntil() {}, passThroughOnException() {} };
    for (const pathname of ['/secure/nested/one', '//secure/nested/one', '///secure/nested/one',
        '/secure//nested/one', '/secure///nested/one', '///secure//nested/one']) {
        await t.test(pathname, async () => {
            let assetRequests = 0;
            const bindings = { ASSETS: { fetch: async request => {
                assetRequests++;
                assert.equal(request.url, 'https://fixture.example' + pathname + '?value=//keep');
                return new Response('synthetic-asset');
            } } };
            const url = 'https://fixture.example' + pathname + '?value=//keep';
            const denied = await worker.fetch(new Request(url), bindings, context);
            assert.equal(denied.status, 403);
            assert.equal(await denied.text(), 'denied');
            assert.equal(assetRequests, 0, 'assets must not be reached before authorization');
            const allowed = await worker.fetch(new Request(url, { headers: { 'x-fixture-allow': 'yes' } }), bindings, context);
            assert.equal(allowed.status, 200);
            assert.equal(await allowed.text(), 'synthetic-asset');
            assert.equal(assetRequests, 1);
            assert.equal(allowed.headers.get('x-fixture-path'), pathname.slice(0, -'/one'.length));
            assert.equal(allowed.headers.get('x-fixture-url'), url);
        });
    }
});
