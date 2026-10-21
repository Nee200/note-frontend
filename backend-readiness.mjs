// The scheduled probe makes one read-only request directly to the Render origin.
// It must not use the storefront cache, customer APIs, cookies or proxy secrets.
const READY_URL = 'https://note-backend-5gy0.onrender.com/ready';

export async function checkBackendReadiness(fetchImpl = fetch) {
    let response;
    try {
        response = await fetchImpl(READY_URL, {
            method: 'GET',
            redirect: 'error',
            cache: 'no-store',
            headers: { Accept: 'application/json', 'Cache-Control': 'no-cache', 'User-Agent': 'Note-Readiness-Monitor/1.0' },
            signal: AbortSignal.timeout(90_000)
        });
    } catch {
        // Do not copy upstream exception text, headers or bodies into logs.
        throw Error('Backend readiness request failed or timed out.');
    }
    if (response.status !== 200) {
        await response.body?.cancel();
        throw Error('Backend readiness returned HTTP ' + response.status + '.');
    }
    let payload;
    try { payload = await response.json(); }
    catch { throw Error('Backend readiness returned invalid JSON.'); }
    if (payload?.status !== 'ready') throw Error('Backend readiness did not confirm status=ready.');
}
