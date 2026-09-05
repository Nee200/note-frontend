(function () {
    'use strict';
    function safeStorage(name) {
        const memory = new Map();
        window.addEventListener('storage', event => { if (event.key) memory.delete(event.key); else memory.clear(); });
        return {
            getItem(key) { if (memory.has(key)) return memory.get(key); try { return window[name].getItem(key); } catch { return null; } },
            setItem(key, value) { memory.set(key, String(value)); try { window[name].setItem(key, String(value)); } catch { /* per-page fallback */ } },
            removeItem(key) { memory.set(key, null); try { window[name].removeItem(key); } catch { /* per-page fallback */ } }
        };
    }
    const local = safeStorage('localStorage'), session = safeStorage('sessionStorage');
    window.NoteStore = { local, session };
    for (const key of ['user_auth_token', 'admin_auth_token']) { local.removeItem(key); session.removeItem(key); }
    function normalizeCart(value) {
        if (!Array.isArray(value)) return [];
        return value.filter(item => item && typeof item === 'object' && typeof item.id === 'string' && item.id.length <= 80 && Number.isSafeInteger(Number(item.quantity)) && Number(item.quantity) > 0 && Number(item.quantity) <= 20)
            .slice(0, 50).map(item => ({ ...item, quantity: Number(item.quantity) }));
    }
    window.NoteCart = {
        read() {
            try { return normalizeCart(JSON.parse(local.getItem('cart') || '[]')); }
            catch { local.removeItem('cart'); return []; }
        },
        write(items) { const cart = normalizeCart(items); local.setItem('cart', JSON.stringify(cart)); local.setItem('cart_schema_version', '2'); return cart; },
        clear() { local.removeItem('cart'); }
    };
    window.NoteMoney = { format(cents, currency = 'EUR') { return cents !== null && Number.isSafeInteger(Number(cents)) ? new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(Number(cents) / 100) : 'Betrag wird geprüft'; } };
    const host = location.hostname;
    const localHost = ['localhost', '127.0.0.1'].includes(host) || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host);
    const base = localHost ? `${location.protocol}//${host}:4242` : location.origin;
    const nativeFetch = window.fetch.bind(window);
    let csrfToken = '', pendingCsrf;
    async function csrf(force = false) {
        if (force) csrfToken = '';
        if (csrfToken) return csrfToken;
        if (!pendingCsrf) pendingCsrf = nativeFetch(base + '/api/csrf-token', { credentials: 'include' }).then(async response => {
            if (!response.ok) throw new Error('Die sichere Verbindung konnte nicht vorbereitet werden.');
            const data = await response.json(); csrfToken = data.csrfToken; return csrfToken;
        }).finally(() => { pendingCsrf = null; });
        return pendingCsrf;
    }
    function checkoutKey(path, body) {
        const fingerprint = path + ':' + String(body || '');
        let attempt;
        try { attempt = JSON.parse(session.getItem('note_checkout_attempt') || 'null'); } catch { /* replace malformed state */ }
        if (attempt?.fingerprint === fingerprint && Date.now() - attempt.at < 1800000) return attempt.key;
        const bytes = new Uint8Array(24); crypto.getRandomValues(bytes);
        const key = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
        session.setItem('note_checkout_attempt', JSON.stringify({ key, fingerprint, at: Date.now() }));
        return key;
    }
    async function request(resource, options = {}) {
        const url = new URL(typeof resource === 'string' ? resource : resource.url, location.href);
        const isApi = url.origin === new URL(base).origin && (/^\/api(?:\/|$)/.test(url.pathname) || ['/create-checkout-session', '/create-pickup-order'].includes(url.pathname));
        if (!isApi) return nativeFetch(resource, options);
        const headers = new Headers(options.headers || {});
        headers.delete('Authorization');
        const method = String(options.method || 'GET').toUpperCase();
        const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(method);
        if (mutating) headers.set('X-CSRF-Token', await csrf());
        if (url.pathname.startsWith('/create-') && !headers.has('Idempotency-Key')) headers.set('Idempotency-Key', checkoutKey(url.pathname, options.body));
        const init = { ...options, method, headers, credentials: 'include' };
        let response = await nativeFetch(url.toString(), init);
        if (mutating && response.status === 403) {
            const data = await response.clone().json().catch(() => ({}));
            if (data.code === 'CSRF_INVALID') { headers.set('X-CSRF-Token', await csrf(true)); response = await nativeFetch(url.toString(), init); }
        }
        if (response.ok && /^\/api\/(login|register|logout|admin\/login|admin\/logout|password-reset\/confirm)$/.test(url.pathname)) csrfToken = '';
        if (response.status === 409 && url.pathname.startsWith('/create-') && (await response.clone().json().catch(() => ({}))).code === 'CHECKOUT_RESTART') session.removeItem('note_checkout_attempt');
        return response;
    }
    window.NoteApi = { base, fetch: request, csrf };
})();
