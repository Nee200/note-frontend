import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('published assets omit the postponed perfume series but retain existing perfume, roller and autumn images', async () => {
    const dist = new URL('../dist/', import.meta.url);
    const manifest = JSON.parse(await fs.readFile(new URL('asset-manifest.json', dist), 'utf8'));
    const report = JSON.parse(await fs.readFile(new URL('build-report.json', dist), 'utf8'));
    for (const key of Object.keys(manifest)) {
        const match = key.match(/new-arrivals\/[gl](\d+)-notes-v3-natural-v\d+\.(png|webp)$/);
        if (match) assert.ok(Number(match[1]) <= 20, `Postponed image was published: ${key}`);
    }
    for (const key of report.deferredImages) assert.equal(manifest[key], undefined, key);
    const retained = [
        ...['g', 'l'].flatMap(prefix => Array.from({ length: 20 }, (_, i) => `images_website/new-arrivals/${prefix}${i + 1}-notes-v3-natural-v1.webp`)),
        ...[6, 10, 14].map(size => `images_website/duftroller/note-duftroller-${size}-closed-v3.webp`),
        'images_website/herbstbundle/note-autumn-hero-v3.webp',
        'images_website/herbstbundle/note-autumn-trio-v3.webp'
    ];
    for (const key of retained) {
        assert.ok(manifest[key], `Required image missing: ${key}`);
        assert.ok((await fs.stat(new URL(manifest[key], dist))).size > 0);
    }
});
