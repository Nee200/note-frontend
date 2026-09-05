import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { parse, parseFragment, serialize } from 'parse5';
import { compileEvents, staticHandler } from './event-compiler.mjs';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const entries = ['index', 'product', 'herrenduefte', 'frauenduefte', 'duftzwillinge', 'neuheiten', 'sommerbundle', 'autoduft', 'suche', 'account', 'admin', 'kontakt', 'ueber-uns', 'versand', 'agb', 'datenschutz', 'impressum', 'widerrufsrecht', 'success', 'cancel', 'newsletter-confirmation'].map(name => name + '.html');
const dist = path.resolve(root, 'dist'), cache = path.join(root, '.build-cache');
const hash = data => crypto.createHash('sha256').update(data).digest('hex').slice(0, 20);
const assets = {}, compiled = new Map(), stats = { originalImageBytes: 0, optimizedImageBytes: 0, images: 0, compiledHandlers: 0 };
const write = async (name, data) => { const target = path.resolve(dist, name); if (!target.startsWith(dist + path.sep)) throw Error('Output außerhalb dist'); await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, data); };
async function emit(data, extension) { const name = 'assets/' + hash(data) + extension; await write(name, data); return name; }
async function walk(dir) { const found = []; for (const entry of await fs.readdir(dir, { withFileTypes: true })) { const name = path.join(dir, entry.name); if (entry.isDirectory()) found.push(...await walk(name)); else found.push(name); } return found; }
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
function set(node, name, value) { const existing = node.attrs.find(item => item.name === name); if (existing) existing.value = value; else node.attrs.push({ name, value }); }
function visit(node, callback) { callback(node); for (const child of [...(node.childNodes || [])]) visit(child, callback); }
function remove(node) { const children = node.parentNode?.childNodes; if (children) children.splice(children.indexOf(node), 1); }
function appendFragment(parent, html, first = false) { const nodes = parseFragment(html).childNodes; nodes.forEach(node => { node.parentNode = parent; }); if (first) parent.childNodes.unshift(...nodes); else parent.childNodes.push(...nodes); }

function replaceAssets(text) {
    return text.replace(/\/?(?:images_(?:website|parfume)\/[\w\-./ %äöüÄÖÜß]+\.(?:png|jpe?g|webp|avif|svg|mp4|webm)|(?:logo|hero|email-[\w-]+|p[123]_[12])\.(?:png|webp))/g, name => { const key = name.replace(/^\//, ''); const mapped = assets[key] || assets[decodeURIComponent(key)]; return mapped ? '/' + mapped : name; });
}
async function imageAssets() {
    await fs.mkdir(cache, { recursive: true });
    const top = (await fs.readdir(root)).filter(name => /\.(?:png|webp|ico|svg)$/i.test(name) && !/test|preview/i.test(name)).map(name => path.join(root, name));
    const images = [...await walk(path.join(root, 'images_website')), ...await walk(path.join(root, 'images_parfume')), ...top].filter(name => /\.(?:png|jpe?g|webp|avif|svg|ico)$/i.test(name));
    // Limit native image processors; builds must also fit smaller CI runners.
    for (let i = 0; i < images.length; i += 4) await Promise.all(images.slice(i, i + 4).map(async name => {
        const original = await fs.readFile(name), relative = path.relative(root, name).replaceAll(path.sep, '/');
        const raster = /\.(png|jpe?g|webp|avif)$/i.test(name); let output = original;
        if (raster) {
            const cacheFile = path.join(cache, hash(original) + '-1600-q82-v1.webp');
            try { output = await fs.readFile(cacheFile); }
            catch { output = await sharp(original).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toBuffer(); await fs.writeFile(cacheFile, output); }
        }
        assets[relative] = await emit(output, raster ? '.webp' : path.extname(name).toLowerCase());
        stats.images++; stats.originalImageBytes += original.length; stats.optimizedImageBytes += output.length;
    }));
    assets['logo.png'] = assets['logo.webp'];
    assets['hero.webp'] = assets['hero.png'];
    assets['images_parfume/parfume_men.png'] = assets['images_parfume/parfume_mann.png'];
    assets['images_parfume/parfume_women.png'] = assets['images_parfume/parfume_frau.png'];
    // The brand video is used by duftzwillinge.html; its name is historical.
    assets['images_website/test.mp4'] = await emit(await fs.readFile(path.join(root, 'images_website/test.mp4')), '.mp4');
}
async function fontAssets() {
    let css = '';
    for (const [pkg, family] of [['inter', 'Inter'], ['playfair-display', 'Playfair Display'], ['cormorant-garamond', 'Cormorant Garamond']]) {
        for (const weight of [300, 400, 500, 600, 700]) for (const style of ['normal', 'italic']) {
            const file = path.join(root, 'node_modules/@fontsource', pkg, 'files', `${pkg}-latin-${weight}-${style}.woff2`);
            try { const name = await emit(await fs.readFile(file), '.woff2'); css += `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};font-display:swap;src:url('/${name}') format('woff2')}\n`; }
            catch (error) { if (error.code !== 'ENOENT') throw error; }
        }
        await write(`licenses/${pkg}.txt`, await fs.readFile(path.join(root, 'node_modules/@fontsource', pkg, 'LICENSE')));
    }
    const faRoot = path.join(root, 'node_modules/@fortawesome/fontawesome-free');
    let icons = await fs.readFile(path.join(faRoot, 'css/all.min.css'), 'utf8');
    for (const font of [...icons.matchAll(/\.\.\/webfonts\/([^)'"\s]+)/g)].map(match => match[1])) {
        const name = await emit(await fs.readFile(path.join(faRoot, 'webfonts', font)), path.extname(font));
        icons = icons.replaceAll('../webfonts/' + font, '/' + name);
    }
    await write('licenses/fontawesome.txt', await fs.readFile(path.join(faRoot, 'LICENSE.txt')));
    return emit(css + icons, '.css');
}
async function compileScript(source, name) {
    const result = compileEvents(replaceAssets(source), name); stats.compiledHandlers += result.count;
    return emit(result.code, '.js');
}
async function referencedAsset(name) {
    const plain = name.split(/[?#]/)[0].replace(/^\.?\//, '');
    if (/^(https?:|data:|blob:)/.test(plain)) return name;
    if (assets[plain]) return assets[plain];
    if (compiled.has(plain)) return compiled.get(plain);
    const target = path.resolve(root, plain); if (!target.startsWith(root + path.sep) || plain.includes('..')) throw Error('Ungültige Referenz ' + name);
    const source = await fs.readFile(target, 'utf8');
    const result = plain.endsWith('.js') ? await compileScript(source, plain) : await emit(replaceAssets(source), path.extname(plain));
    compiled.set(plain, result); return result;
}
export async function build() {
    // Resolve and check the exact generated directory before recursive removal.
    if (dist !== path.join(root, 'dist') || !dist.startsWith(root + path.sep)) throw Error('Ungültiges Build-Ziel');
    await fs.rm(dist, { recursive: true, force: true }); await fs.mkdir(dist, { recursive: true });
    await imageAssets(); const fonts = await fontAssets();
    const events = await referencedAsset('events.js');
    const mapCode = 'window.NoteAssets={map:' + JSON.stringify(assets) + ',image(value){if(!value)return value;let key=String(value).replace(/^\\.?\\//," ").trim().split("?")[0];return this.map[key]||this.map[decodeURI(key)]||value;}};';
    const assetRuntime = await emit(mapCode, '.js');
    for (const entry of entries) {
        const document = parse(await fs.readFile(path.join(root, entry), 'utf8')); const nodes = [];
        visit(document, node => { nodes.push(node); });
        const head = nodes.find(node => node.tagName === 'head');
        const definitions = []; let eventId = 0;
        for (const node of nodes) {
            if (!node.tagName) continue;
            if (node.tagName === 'link' && /fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/.test(attr(node, 'href') || attr(node, 'data-consent-href') || '')) { remove(node); continue; }
            if (attr(node, 'id') === 'social-proof-container' || (attr(node, 'class') || '').split(/\s/).includes('summer-global-clock') || attr(node, 'data-summer-countdown') !== undefined) { remove(node); continue; }
            for (const attribute of [...node.attrs]) if (/^on[a-z]+$/.test(attribute.name)) {
                const id = 's' + (++eventId); definitions.push(`window.NoteEvents.define('${id}',${staticHandler(attribute.value)});`);
                node.attrs = node.attrs.filter(item => item !== attribute); set(node, 'data-note-' + attribute.name, id);
            }
            if (node.tagName === 'script') {
                if (attr(node, 'type') === 'application/ld+json') continue;
                const src = attr(node, 'src');
                if (src) { if (!/^https?:/.test(src)) set(node, 'src', await referencedAsset(src)); }
                else {
                    const code = node.childNodes.map(child => child.value || '').join('');
                    if (code.trim()) { set(node, 'src', await compileScript(code, entry + ':inline')); node.childNodes = []; }
                }
            } else if (node.tagName === 'link' && attr(node, 'rel') === 'stylesheet' && attr(node, 'href')) {
                set(node, 'href', await referencedAsset(attr(node, 'href')));
            } else if (node.tagName === 'style') for (const child of node.childNodes) child.value = replaceAssets(child.value || '');
            for (const attribute of node.attrs) if (['src', 'srcset', 'href', 'style', 'poster', 'content'].includes(attribute.name)) attribute.value = replaceAssets(attribute.value);
        }
        const definitionsFile = await emit(definitions.join('\n'), '.js');
        appendFragment(head, `<link rel="stylesheet" href="/${fonts}"><script src="/${assetRuntime}"></script><script src="/${events}"></script><script src="/${definitionsFile}"></script>`, true);
        await write(entry, serialize(document));
    }
    await write('asset-manifest.json', JSON.stringify(assets));
    for (const name of ['robots.txt', 'sitemap.xml', 'unique_names.json', 'favicon.ico']) await write(name, await fs.readFile(path.join(root, name)));
    await write('_headers', await fs.readFile(path.join(root, '_headers')));
    await write('build-report.json', JSON.stringify({ entries, ...stats }, null, 2));
    console.log(JSON.stringify({ entries: entries.length, ...stats }, null, 2));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
