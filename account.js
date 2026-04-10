// API_BASE_URL is inherited from script.js

async function ensureAccountCsrfToken() {
    if (typeof ensureCsrfTokenCookie === 'function') {
        const token = await ensureCsrfTokenCookie();
        if (token) return token;
    }

    try {
        const response = await fetch(API_BASE_URL + '/api/csrf-token', {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) return '';
        const data = await response.json().catch(() => null);
        return data && typeof data.csrfToken === 'string' ? data.csrfToken : '';
    } catch (error) {
        return '';
    }
}

async function accountFetch(path, options = {}) {
    const requestOptions = { ...options };
    requestOptions.credentials = 'include';
    const headers = new Headers(options.headers || {});
    const method = String(requestOptions.method || 'GET').toUpperCase();

    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !headers.has('X-CSRF-Token')) {
        const csrfToken = await ensureAccountCsrfToken();
        if (csrfToken) {
            headers.set('X-CSRF-Token', csrfToken);
        }
    }

    requestOptions.headers = headers;
    return fetch(API_BASE_URL + path, requestOptions);
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatCurrency(amount) {
    const numericAmount = Number(amount);
    const normalizedAmount = numericAmount > 999 ? numericAmount / 100 : numericAmount;

    if (!Number.isFinite(normalizedAmount)) {
        return 'N/A';
    }

    return `${normalizedAmount.toFixed(2).replace('.', ',')} €`;
}

function getSafeReturnUrl() {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('returnTo');
    if (!returnTo) return null;

    if (/^https?:\/\//i.test(returnTo) || returnTo.startsWith('//')) {
        return null;
    }

    if (!/^[a-zA-Z0-9._~!$&'()*+,;=:@/?%-]+$/.test(returnTo)) {
        return null;
    }

    return returnTo;
}

function redirectAfterAuth() {
    const returnTo = getSafeReturnUrl();
    if (!returnTo) {
        return false;
    }

    window.location.href = returnTo;
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const errorDiv = document.getElementById('login-error');

            errorDiv.style.display = 'none';
            errorDiv.textContent = '';

            try {
                const response = await accountFetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();

                if (!response.ok) {
                    errorDiv.textContent = data.error || 'Login fehlgeschlagen';
                    errorDiv.style.display = 'block';
                    return;
                }

                if (!redirectAfterAuth()) {
                    window.location.reload();
                }
            } catch (error) {
                console.error('Login error:', error);
                errorDiv.textContent = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
                errorDiv.style.display = 'block';
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const name = document.getElementById('register-name').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value;
            const errorDiv = document.getElementById('register-error');
            const successDiv = document.getElementById('register-success');

            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';

            try {
                const response = await accountFetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const data = await response.json();

                if (!response.ok) {
                    errorDiv.textContent = data.error || 'Registrierung fehlgeschlagen';
                    errorDiv.style.display = 'block';
                    return;
                }

                successDiv.textContent = 'Registrierung erfolgreich. Du bist jetzt eingeloggt.';
                successDiv.style.display = 'block';
                registerForm.reset();
                closeRegisterModal();
                if (!redirectAfterAuth()) {
                    window.location.reload();
                }
            } catch (error) {
                console.error('Register error:', error);
                errorDiv.textContent = 'Ein Fehler ist aufgetreten.';
                errorDiv.style.display = 'block';
            }
        });
    }
});

async function checkLoginStatus() {
    const loadingState = document.getElementById('loading-state');
    const authSection = document.getElementById('auth-section');
    const dashboardSection = document.getElementById('dashboard-section');

    try {
        const response = await accountFetch('/api/user');

        if (!response.ok) {
            throw new Error('Not logged in');
        }

        const data = await response.json();

        loadingState.style.display = 'none';
        authSection.style.display = 'none';
        dashboardSection.style.display = 'block';

        document.getElementById('user-name-display').textContent = data.user.name || 'Kunde';
        document.getElementById('user-email-display').textContent = data.user.email;

        renderAddresses(data.user.addresses || []);
        loadOrders();
    } catch (error) {
        console.error('Auth check error:', error);
        loadingState.style.display = 'none';
        authSection.style.display = 'block';
        dashboardSection.style.display = 'none';
    }
}

async function logout() {
    try {
        await accountFetch('/api/logout', { method: 'POST' });
        window.location.reload();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

async function loadOrders() {
    const ordersList = document.getElementById('orders-list');

    try {
        const response = await accountFetch('/api/user/orders');

        if (!response.ok) {
            throw new Error('Orders could not be loaded');
        }

        const data = await response.json();
        const orders = Array.isArray(data.orders) ? data.orders : [];

        if (!orders.length) {
            ordersList.innerHTML = '<p style="color: #666;">Sie haben noch keine Bestellungen aufgegeben.</p>';
            return;
        }

        ordersList.innerHTML = orders.map((order) => {
            const date = order.date ? new Date(order.date).toLocaleDateString('de-DE') : 'Unbekannt';
            const shippingAddress = order.address
                ? `${escapeHtml(order.address.line1 || '')}, ${escapeHtml(order.address.postal_code || '')} ${escapeHtml(order.address.city || '')}`.trim()
                : 'Adresse nicht verfügbar';

            let itemsHtml = '<div class="order-item">Keine Artikeldetails verfügbar</div>';
            if (Array.isArray(order.items) && order.items.length > 0) {
                itemsHtml = order.items.map((item) => `
                    <div class="order-item">
                        <span>${escapeHtml(item.quantity)}x ${escapeHtml(item.description)}</span>
                        <span>${formatCurrency(item.amount_total)}</span>
                    </div>
                `).join('');
            }

            return `
                <div class="order-card">
                    <div class="order-header">
                        <span><strong>Bestelldatum:</strong> ${escapeHtml(date)}</span>
                        <span><strong>Gesamt:</strong> ${formatCurrency(order.amount)}</span>
                    </div>
                    <div class="order-items">
                        ${itemsHtml}
                    </div>
                    <div style="font-size: 0.85rem; color: #888;">
                        <p>Lieferung an: ${shippingAddress}</p>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersList.innerHTML = '<p style="color: red;">Fehler beim Laden der Bestellungen.</p>';
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach((button) => button.classList.remove('active'));
    const activeButton = document.getElementById(`tab-btn-${tabName}`);
    if (activeButton) activeButton.classList.add('active');

    document.querySelectorAll('.tab-content').forEach((content) => {
        content.style.display = 'none';
    });
    const activeContent = document.getElementById(`tab-${tabName}`);
    if (activeContent) activeContent.style.display = 'block';
}

window.openRegisterModal = function () {
    const modal = document.getElementById('reg-modal-backdrop');
    if (modal) modal.classList.add('open');
};

window.closeRegisterModal = function (event) {
    if (event && event.target && event.target.id !== 'reg-modal-backdrop') {
        return;
    }

    const modal = document.getElementById('reg-modal-backdrop');
    if (modal) modal.classList.remove('open');
};

window.openAddressModal = function () {
    const modal = document.getElementById('address-modal');
    if (modal) modal.classList.add('active');
};

window.closeAddressModal = function () {
    const modal = document.getElementById('address-modal');
    if (modal) modal.classList.remove('active');
};

window.addEventListener('click', (event) => {
    const addressModal = document.getElementById('address-modal');
    if (addressModal && event.target === addressModal) {
        addressModal.classList.remove('active');
    }
});

window.addAddress = async function (event) {
    event.preventDefault();

    const firstName = document.getElementById('addr-firstname').value.trim();
    const lastName = document.getElementById('addr-lastname').value.trim();
    const label = document.getElementById('addr-label').value.trim();
    const street = document.getElementById('addr-street').value.trim();
    const zip = document.getElementById('addr-zip').value.trim();
    const city = document.getElementById('addr-city').value.trim();
    const country = document.getElementById('addr-country').value.trim();

    try {
        const response = await accountFetch('/api/user/address', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, label, street, zip, city, country })
        });

        if (!response.ok) {
            throw new Error('Address could not be saved');
        }

        const data = await response.json();
        renderAddresses(data.addresses || []);
        closeAddressModal();
        document.getElementById('address-form').reset();
    } catch (error) {
        console.error(error);
        alert('Fehler beim Hinzufügen der Adresse');
    }
};

window.deleteAddress = async function (id) {
    if (!confirm('Adresse wirklich löschen?')) return;

    try {
        const response = await accountFetch(`/api/user/address/${id}`, { method: 'DELETE' });

        if (!response.ok) {
            throw new Error('Address could not be deleted');
        }

        const data = await response.json();
        renderAddresses(data.addresses || []);
    } catch (error) {
        console.error(error);
        alert('Fehler beim Löschen der Adresse');
    }
};

function renderAddresses(addresses) {
    const list = document.getElementById('address-list');
    if (!list) return;

    if (!addresses || addresses.length === 0) {
        list.innerHTML = '<p style="color:#777;">Noch keine Adressen hinterlegt.</p>';
        return;
    }

    list.innerHTML = addresses.map((address) => `
        <div class="address-card">
            <button class="delete-address-btn" onclick="deleteAddress('${escapeHtml(address.id)}')" title="Löschen">
                <i class="fas fa-trash"></i>
            </button>
            <div style="font-weight:600; margin-bottom:5px; font-size: 1.1em;">${escapeHtml(address.label || 'Adresse')}</div>
            <div style="margin-bottom: 5px; color: #333;">${escapeHtml(address.firstName || '')} ${escapeHtml(address.lastName || '')}</div>
            <div style="color: #555;">${escapeHtml(address.street)}</div>
            <div style="color: #555;">${escapeHtml(address.zip)} ${escapeHtml(address.city)}</div>
            <div style="color:#777; font-size:0.9em; margin-top: 5px;">${escapeHtml(address.country)}</div>
        </div>
    `).join('');
}
