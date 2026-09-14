'use strict';
window.NoteAdminAccess = (() => {
    const el = id => document.getElementById(id);
    async function api(path, body) {
        const response = await window.NoteApi.fetch(window.NoteApi.base + '/api/admin/' + path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Die Anfrage konnte nicht ausgeführt werden.');
        return data;
    }
    function error(id, message = '') { el(id).textContent = message; el(id).hidden = !message; }
    function clear() {
        for (const id of ['setup-password', 'setup-password-repeat', 'setup-otp', 'access-invitation-text']) el(id).value = '';
        el('setup-qr').removeAttribute('src'); el('setup-secret').textContent = '';
        el('access-invitation').hidden = true;
        el('admin-setup').hidden = true; el('admin-login-fields').hidden = false;
    }
    function showSetup(data) {
        el('dashboard').style.display = 'none'; el('login-screen').style.display = 'flex';
        el('admin-login-fields').hidden = true; el('admin-setup').hidden = false;
        el('admin-pw').value = ''; el('admin-otp').value = '';
        error('setup-error');
        const password = data.step === 'password';
        el('setup-step').textContent = password ? 'Schritt 1 von 2' : 'Schritt 2 von 2';
        el('setup-title').textContent = password ? 'Dein eigenes Passwort' : 'Authenticator einrichten';
        el('setup-intro').textContent = password ? 'Das Einmalpasswort ist verbraucht. Lege jetzt dein persönliches Passwort fest.' : 'Scanne den QR-Code mit deiner Authenticator-App und bestätige den angezeigten Code. Erst dann wird dein Zugang aktiviert.';
        el('setup-password-form').hidden = !password; el('setup-mfa-form').hidden = password;
        if (!password) { el('setup-qr').src = data.qr; el('setup-secret').textContent = data.secret; }
        el(password ? 'setup-password' : 'setup-otp').focus();
    }
    async function resume() {
        try { const data = await api('setup'); if (!['password', 'mfa'].includes(data.step)) return false; showSetup(data); return true; } catch { return false; }
    }
    async function submit(form, errorId, action) {
        const button = form.querySelector('button[type="submit"]');
        button.disabled = true; error(errorId);
        try { await action(); } catch (failure) { error(errorId, failure.message); }
        finally { button.disabled = false; }
    }
    el('setup-password-form').addEventListener('submit', event => {
        event.preventDefault(); submit(event.currentTarget, 'setup-error', async () => {
            const password = el('setup-password').value;
            if (password !== el('setup-password-repeat').value) throw new Error('Die Passwörter stimmen nicht überein.');
            const result = await api('setup/password', { password });
            el('setup-password').value = ''; el('setup-password-repeat').value = '';
            showSetup(result);
        });
    });
    el('setup-mfa-form').addEventListener('submit', event => {
        event.preventDefault(); submit(event.currentTarget, 'setup-error', async () => {
            await api('setup/confirm', { otp: el('setup-otp').value.trim() });
            clear(); await checkAuth();
        });
    });
    el('setup-cancel').addEventListener('click', async () => {
        try { await api('setup/cancel', {}); clear(); } catch (failure) { error('setup-error', failure.message); }
    });
    async function invite(username, renew = false) {
        const data = await api('access/invite', { username, renew });
        el('access-invitation-text').value = `NØTE. Betreiber-Zugang\nAnmeldung: ${location.origin}/admin\nBenutzername: ${data.username}\nEinmalpasswort: ${data.oneTimePassword}\nGültig bis: ${new Date(data.expiresAt).toLocaleString('de-DE')}\n\nBei der ersten Anmeldung das Authenticator-Feld leer lassen. Danach eigenes Passwort festlegen, Authenticator einrichten und Code bestätigen.`;
        el('access-invitation').hidden = false;
        await load();
    }
    el('access-invite-form').addEventListener('submit', event => {
        event.preventDefault(); submit(event.currentTarget, 'access-error', () => invite(el('access-username').value.trim()));
    });
    el('access-copy').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(el('access-invitation-text').value); el('access-copy').textContent = 'Kopiert'; }
        catch { el('access-invitation-text').focus(); el('access-invitation-text').select(); }
    });
    async function load() {
        try {
            const { accounts } = await api('access');
            const list = el('access-list'); list.replaceChildren();
            if (!accounts.length) list.textContent = 'Noch keine zusätzlichen Zugänge.';
            const labels = { invited: 'Einladung erstellt', password: 'Passwort-Einrichtung begonnen', mfa: 'Authenticator noch bestätigen', active: 'Aktiv · vollständiger Zugriff' };
            for (const account of accounts) {
                const row = document.createElement('div'); row.className = 'access-account';
                const label = document.createElement('span'); label.textContent = `${account.username} · ${labels[account.status] || account.status}`; row.append(label);
                if (account.status !== 'active') {
                    const button = document.createElement('button'); button.className = 'btn'; button.type = 'button'; button.textContent = 'Neue Einladung';
                    button.addEventListener('click', async () => { button.disabled = true; error('access-error'); try { await invite(account.username, true); } catch (failure) { error('access-error', failure.message); } finally { button.disabled = false; } }); row.append(button);
                }
                list.append(row);
            }
        } catch (failure) { error('access-error', failure.message); }
    }
    return { showSetup, resume, load, clear };
})();
