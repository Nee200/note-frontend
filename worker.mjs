const isApi = path => path.startsWith('/api/') || ['/create-checkout-session', '/create-pickup-order'].includes(path);
let manifest;
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (isApi(url.pathname)) {
            let origin;
            try { origin = new URL(env.API_ORIGIN); } catch { return new Response('API-Konfiguration ungültig', { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
            if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash || String(env.PROXY_SHARED_SECRET || '').length < 32) return new Response('API-Konfiguration ungültig', { status: 503, headers: { 'Cache-Control': 'no-store' } });
            const headers = new Headers(request.headers);
            headers.set('Host', origin.host);
            headers.delete('Forwarded'); headers.delete('X-Forwarded-For'); headers.delete('X-Real-IP');
            const clientIp = request.headers.get('CF-Connecting-IP');
            if (clientIp) headers.set('X-Forwarded-For', clientIp);
            headers.delete('X-Note-Client-IP');
            if (clientIp) headers.set('X-Note-Client-IP', clientIp);
            // Render sees a fixed proxy credential, so forwarded IPs cannot be
            // spoofed by callers who connect to the backend directly.
            headers.set('X-Note-Proxy-Secret', env.PROXY_SHARED_SECRET || '');
            let upstream;
            try { upstream = await fetch(origin.origin + url.pathname + url.search, { method: request.method, headers, body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body, redirect: 'manual' }); }
            catch { return Response.json({ error: 'Der Shop-Service ist vorübergehend nicht erreichbar.' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } }); }
            const response = new Response(upstream.body, upstream);
            response.headers.set('Cache-Control', 'private, no-store'); return response;
        }
        const direct = await env.ASSETS.fetch(request);
        if (direct.status !== 404) return direct;
        if (!manifest) { const result = await env.ASSETS.fetch(new Request(url.origin + '/asset-manifest.json')); if (result.ok) manifest = await result.json(); }
        let key;
        try { key = decodeURIComponent(url.pathname.slice(1)); } catch { return new Response('Ungültiger Pfad', { status: 400 }); }
        const mapped = Object.hasOwn(manifest || {}, key) ? manifest[key] : undefined;
        if (mapped) return Response.redirect(url.origin + '/' + mapped, 302);
        return direct;
    }
};
