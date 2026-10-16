'use strict';
(() => {
    const el = id => document.getElementById('withdrawal-' + id);
    const form = el('form');
    let payload, requestId, snapshot, busy = false, receipt;
    function error(message = '') { el('error').textContent = message; el('error').hidden = !message; if (message) el('error').focus(); }
    function show(stage) {
        for (const name of ['input', 'review', 'success']) el(name).hidden = name !== stage;
        for (const name of ['input', 'review']) el('step-' + name).removeAttribute('aria-current');
        if (stage !== 'success') el('step-' + stage).setAttribute('aria-current', 'step');
        el(stage + '-title').focus();
    }
    function entries(data, includeReceipt = false) {
        return [...(includeReceipt ? [['Referenz', data.reference], ['Eingang', new Date(data.receivedAt).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', timeZoneName: 'short' })], ['Eingang (UTC)', data.receivedAt]] : []),
            ['Name', data.name], ['E-Mail für die Eingangsbestätigung', data.email], ['Bestellung / Vertrag', data.contract],
            ['Umfang', data.scope === 'partial' ? 'Einzelne Artikel' : 'Gesamte Bestellung'], ...(data.items ? [['Artikel und Mengen', data.items]] : []), ['Widerrufserklärung', data.declaration]];
    }
    function details(target, data, includeReceipt) {
        target.replaceChildren();
        for (const [label, value] of entries(data, includeReceipt)) {
            const term = document.createElement('dt'), definition = document.createElement('dd');
            term.textContent = label; definition.textContent = value; target.append(term, definition);
        }
    }
    form.addEventListener('change', () => {
        const partial = new FormData(form).get('scope') === 'partial';
        el('items-wrap').hidden = !partial; el('items').required = partial;
    });
    form.addEventListener('submit', event => {
        event.preventDefault(); error();
        const data = new FormData(form), scope = data.get('scope');
        payload = { name: data.get('name').trim(), email: data.get('email').trim().toLowerCase(), contract: data.get('contract').trim(), scope, items: scope === 'partial' ? data.get('items').trim() : '' };
        if (!payload.name || !payload.contract || (scope === 'partial' && !payload.items)) return error('Bitte fülle alle Angaben aus.');
        const value = JSON.stringify(payload);
        if (value !== snapshot) { requestId = crypto.randomUUID(); snapshot = value; }
        details(el('review-details'), { ...payload, declaration: scope === 'partial' ? 'Hiermit widerrufe ich den angegebenen Vertrag hinsichtlich der unten genannten Artikel.' : 'Hiermit widerrufe ich den angegebenen Vertrag vollständig.' });
        show('review');
    });
    el('edit').addEventListener('click', () => { if (!busy) { error(); show('input'); } });
    el('confirm').addEventListener('click', async () => {
        if (busy || receipt) return;
        busy = true; error(); el('confirm').disabled = true; el('edit').disabled = true;
        el('confirm').textContent = 'Wird übermittelt …';
        try {
            const response = await window.NoteApi.fetch(window.NoteApi.base + '/api/withdrawals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId, ...payload }), signal: AbortSignal.timeout(25000) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Die Übermittlung konnte nicht bestätigt werden.');
            if (!data.success || !data.receipt?.reference || !data.receipt?.receivedAt) throw new Error('Die Eingangsbestätigung konnte nicht geladen werden.');
            receipt = data.receipt;
            details(el('receipt'), receipt, true);
            el('mail-message').textContent = data.emailStatus === 'accepted'
                ? 'Die Eingangsbestätigung wurde an den E-Mail-Dienst zum Versand an ' + receipt.email + ' übergeben. Du kannst sie auch direkt herunterladen.'
                : 'Deine Erklärung ist gespeichert. Der E-Mail-Versand steht noch aus und wird erneut versucht. Lade dir die Eingangsbestätigung jetzt herunter.';
            show('success');
        } catch (failure) {
            error((failure.name === 'TimeoutError' || failure.name === 'AbortError' || failure instanceof TypeError ? 'Die Verbindung wurde unterbrochen. Der Eingang konnte hier noch nicht bestätigt werden.' : failure.message) + ' Bitte versuche die Übermittlung erneut. Deine Erklärung wird bei einem erneuten Versuch mit denselben Angaben nicht doppelt gespeichert. Alternativ: info@note-fragrances.de.');
        } finally { busy = false; el('confirm').disabled = false; el('edit').disabled = false; el('confirm').textContent = 'Widerruf bestätigen'; }
    });
    el('download').addEventListener('click', () => {
        if (!receipt) return;
        const text = ['NØTE. fragrances – Eingangsbestätigung Widerruf', ...entries(receipt, true).map(([label, value]) => label + ': ' + value), 'Empfänger: Deniz Löbel · NØTE. fragrances · Warnitzer Str. 20 · 13057 Berlin · info@note-fragrances.de'].join('\r\n\r\n');
        const url = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' }));
        const link = document.createElement('a'); link.href = url; link.download = receipt.reference + '.txt'; document.body.append(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    });
})();
