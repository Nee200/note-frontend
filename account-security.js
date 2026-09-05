(function () {
    let user;
    function message(element, text) { element.textContent = text; element.setAttribute('role', 'status'); }
    const api = (path, body) => window.NoteApi.fetch(window.NoteApi.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    window.addEventListener('note:account-loaded', event => { user = event.detail; renderVerification(); });
    function renderVerification() {
        if (!user) return;
        let panel = document.getElementById('account-verification');
        if (!panel) {
            panel = document.createElement('div'); panel.id = 'account-verification'; panel.className = 'account-security-panel';
            document.getElementById('dashboard-section')?.prepend(panel);
        }
        const params = new URLSearchParams(location.hash.slice(1));
        panel.replaceChildren();
        const status = document.createElement('p'); panel.append(status);
        const button = document.createElement('button'); button.type = 'button'; button.className = 'btn-auth'; panel.append(button);
        if (user.emailVerified) {
            status.textContent = 'Du kannst auch frühere Gastbestellungen mit deiner bestätigten E-Mail-Adresse zuordnen.';
            button.textContent = 'Gastbestellungen zuordnen';
            button.addEventListener('click', async () => {
                button.disabled = true;
                try { const response = await api('/api/user/orders/claim', {}); const result = await response.json(); if (!response.ok) throw new Error(result.error); message(status, `${result.claimed || 0} Gastbestellungen wurden deinem Konto zugeordnet.`); if (typeof loadOrders === 'function') await loadOrders(); }
                catch (error) { message(status, error.message); } finally { button.disabled = false; }
            });
        } else {
            status.textContent = 'Bitte bestätige deine E-Mail-Adresse, bevor du auf Bestellungen zugreifst.';
            const token = params.get('verify');
            button.textContent = token ? 'E-Mail-Adresse bestätigen' : 'Bestätigungslink senden';
            button.addEventListener('click', async () => {
                button.disabled = true;
                try {
                    const response = await api(token ? '/api/user/verify-email' : '/api/user/verification', token ? { token } : {});
                    const result = await response.json(); if (!response.ok) throw new Error(result.error);
                    if (token) { history.replaceState(null, '', location.pathname + location.search); user = result.user; renderVerification(); if (typeof loadOrders === 'function') await loadOrders(); }
                    else message(status, result.message);
                } catch (error) { message(status, error.message); } finally { button.disabled = false; }
            });
        }
    }
    document.addEventListener('DOMContentLoaded', () => {
        const loginForm = document.getElementById('login-form');
        const requestButton = document.createElement('button'); requestButton.type = 'button'; requestButton.className = 'account-reset-link'; requestButton.textContent = 'Passwort vergessen?';
        const status = document.createElement('p'); status.setAttribute('role', 'status');
        loginForm?.after(requestButton, status);
        requestButton.addEventListener('click', async () => {
            const email = document.getElementById('login-email');
            if (!email?.checkValidity() || !email.value.trim()) { email?.reportValidity(); return; }
            requestButton.disabled = true;
            try { const response = await api('/api/password-reset/request', { email: email.value.trim() }); const result = await response.json(); message(status, result.message || result.error); }
            catch { message(status, 'Der Link konnte gerade nicht angefordert werden. Bitte versuche es später erneut.'); }
            finally { requestButton.disabled = false; }
        });
        const params = new URLSearchParams(location.hash.slice(1));
        if (params.has('verify')) message(status, 'Melde dich mit dem zugehörigen Konto an und bestätige danach deine E-Mail-Adresse.');
        const token = params.get('reset');
        if (token) {
            const form = document.createElement('form'); form.className = 'account-security-panel';
            form.innerHTML = '<h2>Neues Passwort festlegen</h2><label for="recovery-password">Neues Passwort (mindestens 12 Zeichen)</label><input id="recovery-password" type="password" minlength="12" maxlength="72" autocomplete="new-password" required><button type="submit" class="btn-auth">Passwort speichern</button><p role="status"></p>';
            document.getElementById('loading-state')?.parentElement.prepend(form);
            form.addEventListener('submit', async event => {
                event.preventDefault(); const button = form.querySelector('button'); button.disabled = true;
                try { const response = await api('/api/password-reset/confirm', { token, password: form.querySelector('input').value }); const result = await response.json(); if (!response.ok) throw new Error(result.error); history.replaceState(null, '', location.pathname); location.reload(); }
                catch (error) { message(form.querySelector('p'), error.message); button.disabled = false; }
            });
        }
    });
})();
