import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const cli = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));

for (const pagesFunctions of [false, true]) {
    test(pagesFunctions ? 'unattended root autoconfig stops instead of publishing Pages server code' : 'root autoconfig creates exclusions for local configuration and server files', async t => {
        const root = await fs.mkdtemp(path.join(os.tmpdir(), 'note-autoconfig-test-'));
        t.after(async () => {
            assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
            assert.ok(path.basename(root).startsWith('note-autoconfig-test-'));
            await fs.rm(root, { recursive: true, force: true });
        });
        const project = path.join(root, 'project');
        await fs.mkdir(project);
        await fs.writeFile(path.join(project, 'package.json'), JSON.stringify({ name: 'synthetic-static-site', version: '1.0.0', private: true }));
        await fs.writeFile(path.join(project, 'index.html'), '<p>Synthetic public fixture</p>');
        if (pagesFunctions) {
            await fs.mkdir(path.join(project, 'functions'));
            await fs.writeFile(path.join(project, 'functions/api.js'), 'export const onRequest = () => new Response("fixture");');
        } else {
            // An existing narrow exclusion must also protect other .env files.
            await fs.writeFile(path.join(project, '.assetsignore'), '.env\n');
        }
        const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(path|systemroot|windir|temp|tmp)$/i.test(key)));
        Object.assign(env, { HOME: root, USERPROFILE: root, APPDATA: root, LOCALAPPDATA: root, XDG_CONFIG_HOME: root,
            WRANGLER_SEND_METRICS: 'false', WRANGLER_LOG_PATH: path.join(root, 'logs'), CI: 'true', NO_COLOR: '1' });
        // Setup writes only the disposable fixture. It neither installs packages nor deploys.
        const result = spawnSync(process.execPath, [cli, 'setup', '--yes', '--no-install-wrangler', '--no-install-skills', '--no-completion-message'],
            { cwd: project, env, encoding: 'utf8', timeout: 30000, windowsHide: true });
        assert.ifError(result.error);
        const output = result.stdout + result.stderr;
        if (pagesFunctions) {
            assert.notEqual(result.status, 0, 'an ambiguous Pages root must not be accepted');
            assert.match(output, /Automatic configuration cannot migrate Pages Functions/);
            await assert.rejects(fs.access(path.join(project, 'wrangler.jsonc')), { code: 'ENOENT' });
        } else {
            assert.equal(result.status, 0, output);
            const exclusions = (await fs.readFile(path.join(project, '.assetsignore'), 'utf8')).split(/\r?\n/);
            for (const entry of ['.env*', '.dev.vars*', '.git', 'node_modules', '.npmrc', '/functions', '/_worker.js', '/_routes.json']) {
                assert.ok(exclusions.includes(entry), entry + ' must be excluded from root uploads');
            }
        }
    });
}
