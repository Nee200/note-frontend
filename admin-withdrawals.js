'use strict';
window.NoteAdminWithdrawals = (() => {
    const el = id => document.getElementById('admin-withdrawal-' + id);
    let page = 1, revision = 0;
    const labels = { received: 'Eingegangen', processing: 'In Bearbeitung', completed: 'Abgeschlossen' };
    const mailLabels = { accepted: 'An Mail-Dienst übergeben', simulated: 'Simuliert', pending: 'Wartet auf Versand / erneuten Versuch', sending: 'Versand läuft', manual_review: 'Providerstatus manuell prüfen', not_queued: 'Versandauftrag wird vorbereitet' };
    async function api(path, body) {
        const response = await window.NoteApi.fetch(window.NoteApi.base + '/api/admin/withdrawals' + path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Die Anfrage konnte nicht ausgeführt werden.');
        return data;
    }
    function clear() { revision++; page = 1; el('list').replaceChildren(); el('message').textContent = ''; }
    async function load(next = 1) {
        const current = ++revision;
        el('message').textContent = 'Widerrufe werden geladen …'; el('previous').disabled = true; el('next').disabled = true;
        try {
            const data = await api('?page=' + next);
            if (current !== revision) return;
            page = data.page; el('list').replaceChildren(); el('message').textContent = data.withdrawals.length ? '' : 'Noch keine Widerrufe eingegangen.';
            for (const record of data.withdrawals) {
                const card = document.createElement('article'); card.className = 'card withdrawal-admin-card';
                const title = document.createElement('h3'); title.textContent = `${record.reference} · ${record.name}`;
                const details = document.createElement('dl'); details.className = 'withdrawal-admin-details';
                for (const [label, value] of [
                    ['Eingang', new Date(record.receivedAt).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', timeZoneName: 'short' })],
                    ['E-Mail', record.email], ['Bestellung / Vertrag', record.contract], ['Umfang', record.scope === 'partial' ? 'Einzelne Artikel' : 'Gesamte Bestellung'],
                    ...(record.items ? [['Artikel und Mengen', record.items]] : []), ['Erklärung', record.declaration],
                    ['Bestätigung an Kunden', mailLabels[record.mailStatus.customer] || record.mailStatus.customer], ['Benachrichtigung an Betreiber', mailLabels[record.mailStatus.operator] || record.mailStatus.operator]]) {
                    const term = document.createElement('dt'), definition = document.createElement('dd'); term.textContent = label; definition.textContent = value; details.append(term, definition);
                }
                const form = document.createElement('form'), label = document.createElement('label'), select = document.createElement('select'), button = document.createElement('button'), message = document.createElement('p');
                label.textContent = 'Bearbeitungsstatus'; select.id = 'withdrawal-status-' + record._id; label.htmlFor = select.id;
                for (const [value, text] of Object.entries(labels)) { const option = document.createElement('option'); option.value = value; option.textContent = text; select.append(option); }
                select.value = record.status; button.type = 'submit'; button.className = 'btn'; button.textContent = 'Status speichern'; message.setAttribute('role', 'status');
                form.append(label, select, button, message);
                form.addEventListener('submit', async event => {
                    event.preventDefault(); button.disabled = true; message.textContent = '';
                    try { await api('/' + record._id + '/status', { status: select.value }); message.textContent = 'Status gespeichert.'; }
                    catch (error) { message.textContent = error.message; }
                    finally { button.disabled = false; }
                });
                card.append(title, details, form); el('list').append(card);
            }
            el('page').textContent = 'Seite ' + page; el('previous').disabled = page <= 1; el('next').disabled = !data.hasMore;
        } catch (error) { if (current === revision) el('message').textContent = error.message; }
    }
    el('previous').addEventListener('click', () => load(page - 1)); el('next').addEventListener('click', () => load(page + 1)); el('refresh').addEventListener('click', () => load(page));
    return { load, clear };
})();
