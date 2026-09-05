import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain', '.xml': 'application/xml', '.mp4': 'video/mp4', '.webm': 'video/webm' };
export async function preview(port = 5500) {
    const config = await fs.readFile(path.join(root, '_headers'), 'utf8');
    const headers = {};
    for (const line of config.split(/\r?\n/)) { if (line.startsWith('/assets/')) break; const match = line.match(/^\s{2}([^:]+):\s*(.+)$/); if (match) headers[match[1]] = match[2]; }
    headers['Content-Security-Policy'] = headers['Content-Security-Policy'].replace('; upgrade-insecure-requests', '').replace("connect-src 'self'", "connect-src 'self' http://127.0.0.1:4242 http://localhost:4242");
    const manifest = JSON.parse(await fs.readFile(path.join(root, 'asset-manifest.json'), 'utf8'));
    const server = http.createServer(async (request, response) => {
        try {
            const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
            let name = pathname === '/' ? 'index.html' : pathname.slice(1);
            if (manifest[name]) { response.writeHead(302, { Location: '/' + manifest[name] }); return response.end(); }
            const file = path.resolve(root, name);
            if (!file.startsWith(root + path.sep) || name.split('/').some(part => part.startsWith('.')) || name === '_headers') { response.writeHead(404); return response.end(); }
            const data = await fs.readFile(file); response.writeHead(200, { ...headers, 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': name.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'no-cache' });
            response.end(request.method === 'HEAD' ? undefined : data);
        } catch (error) { response.writeHead(error.code === 'ENOENT' || error.code === 'EISDIR' ? 404 : 500); response.end('Datei nicht verfügbar'); }
    });
    await new Promise(resolve => server.listen(port, '127.0.0.1', resolve)); return server;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { const server = await preview(Number(process.env.FRONTEND_PORT || 5500)); console.log('Lokale Vorschau auf Port ' + server.address().port); }
