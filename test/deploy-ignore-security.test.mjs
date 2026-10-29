import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const cli = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));

test('deployment rejects unreadable asset exclusions instead of silently including files', async t => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'note-assetsignore-test-'));
    t.after(async () => {
        assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
        assert.ok(path.basename(root).startsWith('note-assetsignore-test-'));
        await fs.rm(root, { recursive: true, force: true });
    });
    const assets = path.join(root, 'public');
    await fs.mkdir(assets);
    await fs.writeFile(path.join(assets, 'index.html'), '<p>Public fixture</p>');
    await fs.writeFile(path.join(assets, 'excluded.txt'), 'Synthetic exclusion fixture');
    const config = path.join(root, 'wrangler.json');
    await fs.writeFile(config, JSON.stringify({ name: 'note-ignore-security-test', compatibility_date: '2026-09-02', assets: { directory: './public' } }));

    // An isolated config and environment keep this dry run away from account credentials.
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(path|systemroot|windir|temp|tmp)$/i.test(key)));
    Object.assign(env, { HOME: root, USERPROFILE: root, APPDATA: root, LOCALAPPDATA: root, XDG_CONFIG_HOME: root,
        WRANGLER_SEND_METRICS: 'false', WRANGLER_LOG_PATH: path.join(root, 'logs'), CI: 'true', NO_COLOR: '1' });

    for (const [label, bytes, valid] of [
        ['invalid UTF-8', Buffer.from([0xff, 0x0a]), false],
        ['UTF-16 without BOM', Buffer.from('excluded.txt\n', 'utf16le'), false],
        ['embedded NUL', Buffer.from('excluded\0.txt\n'), false],
        ['UTF-8 with BOM, Unicode and CRLF', Buffer.from('\uFEFF# Ausschlüsse\r\nexcluded.txt\r\n'), true]
    ]) {
        await t.test(label, async () => {
            await fs.writeFile(path.join(assets, '.assetsignore'), bytes);
            const result = spawnSync(process.execPath, [cli, 'deploy', '--dry-run', '--config', config, '--outdir', path.join(root, 'output')],
                { cwd: root, env, encoding: 'utf8', timeout: 30000, windowsHide: true });
            assert.ifError(result.error);
            const output = result.stdout + result.stderr;
            if (valid) {
                assert.equal(result.status, 0, output);
                assert.match(output, /dry.run/i);
            } else {
                assert.notEqual(result.status, 0, label + ' must stop deployment');
                assert.match(output, /must be UTF-8 encoded and must not contain null characters/, output);
            }
        });
    }
});
