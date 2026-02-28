// API_BASE_URL is inherited from script.js
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();

    // Login Form Handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorDiv = document.getElementById('login-error');

            errorDiv.style.display = 'none';
            errorDiv.textContent = '';

            try {
                const response = await fetch(API_BASE_URL + '/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Login successful, reload to show dashboard
                    window.location.reload();
                } else {
                    errorDiv.textContent = data.error || 'Login fehlgeschlagen';
                    errorDiv.style.display = 'block';
                }
            } catch (err) {
                console.error('Login error:', err);
                errorDiv.textContent = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
                errorDiv.style.display = 'block';
            }
        });
    }

    // Register Form Handler
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const errorDiv = document.getElementById('register-error');
            const successDiv = document.getElementById('register-success');

            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';

            try {
                const response = await fetch(API_BASE_URL + '/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    successDiv.textContent = 'Registrierung erfolgreich! Bitte melden Sie sich an.';
                    successDiv.style.display = 'block';
                    registerForm.reset();
                } else {
                    errorDiv.textContent = data.error || 'Registrierung fehlgeschlagen';
                    errorDiv.style.display = 'block';
                }
            } catch (err) {
                console.error('Register error:', err);
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
        const response = await fetch(API_BASE_URL + '/api/user');

        if (response.ok) {
            const data = await response.json();
            // User is logged in
            loadingState.style.display = 'none';
            authSection.style.display = 'none';
            dashboardSection.style.display = 'block';

            // Update User Info
            document.getElementById('user-name-display').textContent = data.user.name || 'Kunde';
            document.getElementById('user-email-display').textContent = data.user.email;

            // Populate Addresses
            renderAddresses(data.user.addresses || []);

            // Load Orders
            loadOrders();
        } else {
            // User is not logged in
            loadingState.style.display = 'none';
            authSection.style.display = 'block';
            dashboardSection.style.display = 'none';
        }
    } catch (err) {
        console.error('Auth check error:', err);
        // Fallback to logged out state
        loadingState.style.display = 'none';
        authSection.style.display = 'block';
        dashboardSection.style.display = 'none';
    }
}

async function logout() {
    try {
        await fetch(API_BASE_URL + '/api/logout', { method: 'POST' });
        window.location.reload();
    } catch (err) {
        console.error('Logout error:', err);
    }
}

async function loadOrders() {
    const ordersList = document.getElementById('orders-list');

    try {
        const response = await fetch(API_BASE_URL + '/api/user/orders');
        if (response.ok) {
            const data = await response.json();
            const orders = data.orders;

            if (orders && orders.length > 0) {
                ordersList.innerHTML = orders.map(order => {
                    const date = new Date(order.date).toLocaleDateString('de-DE');
                    const amount = order.amount ? `${order.amount.toFixed(2)} €` : 'N/A';

                    let itemsHtml = '';
                    if (order.items && order.items.length > 0) {
                        itemsHtml = order.items.map(item => `
                            <div class="order-item">
                                <span>${item.quantity}x ${item.description}</span>
                                <span>${(item.amount_total).toFixed(2)} €</span>
                            </div>
                        `).join('');
                    } else {
                        itemsHtml = '<div class="order-item">Keine Artikeldetails verfügbar</div>';
                    }

                    return `
                        <div class="order-card">
                            <div class="order-header">
                                <span><strong>Bestelldatum:</strong> ${date}</span>
                                <span><strong>Gesamt:</strong> ${amount}</span>
                            </div>
                            <div class="order-items">
                                ${itemsHtml}
                            </div>
                            <div style="font-size: 0.85rem; color: #888;">
                                <p>Lieferung an: ${order.address ? `${order.address.line1}, ${order.address.postal_code} ${order.address.city}` : 'Adresse nicht verfügbar'}</p>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                ordersList.innerHTML = '<p style="color: #666;">Sie haben noch keine Bestellungen aufgegeben.</p>';
            }
        }
    } catch (err) {
        console.error('Error loading orders:', err);
        ordersList.innerHTML = '<p style="color: red;">Fehler beim Laden der Bestellungen.</p>';
    }
}

// --- Profile & Tabs Logic ---

function switchTab(tabName) {
    // Buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`tab-btn-${tabName}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Content
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    const activeContent = document.getElementById(`tab-${tabName}`);
    if (activeContent) activeContent.style.display = 'block';
}

// Address Modal
window.openAddressModal = function () {
    const modal = document.getElementById('address-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

window.closeAddressModal = function () {
    const modal = document.getElementById('address-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close modal when clicking outside
window.addEventListener('click', function (event) {
    const modal = document.getElementById('address-modal');
    if (modal && event.target == modal) {
        modal.classList.remove('active');
    }
});

window.addAddress = async function (event) {
    event.preventDefault();
    const firstName = document.getElementById('addr-firstname').value;
    const lastName = document.getElementById('addr-lastname').value;
    const label = document.getElementById('addr-label').value;
    const street = document.getElementById('addr-street').value;
    const zip = document.getElementById('addr-zip').value;
    const city = document.getElementById('addr-city').value;
    const country = document.getElementById('addr-country').value;

    try {
        const response = await fetch(API_BASE_URL + '/api/user/address', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, label, street, zip, city, country })
        });

        if (response.ok) {
            const data = await response.json();
            renderAddresses(data.addresses);
            closeAddressModal();
            document.getElementById('address-form').reset();
        } else {
            alert('Fehler beim Hinzufügen der Adresse');
        }
    } catch (err) {
        console.error(err);
    }
}

window.deleteAddress = async function (id) {
    if (!confirm('Adresse wirklich löschen?')) return;

    try {
        const response = await fetch(API_BASE_URL + `/api/user/address/${id}`, { method: 'DELETE' });
        if (response.ok) {
            const data = await response.json();
            renderAddresses(data.addresses);
        }
    } catch (err) {
        console.error(err);
    }
}

function renderAddresses(addresses) {
    const list = document.getElementById('address-list');
    if (!addresses || addresses.length === 0) {
        list.innerHTML = '<p style="color:#777;">Noch keine Adressen hinterlegt.</p>';
        return;
    }

    list.innerHTML = addresses.map(addr => `
        <div class="address-card">
            <button class="delete-address-btn" onclick="deleteAddress('${addr.id}')" title="Löschen">
                <i class="fas fa-trash"></i>
            </button>
            <div style="font-weight:600; margin-bottom:5px; font-size: 1.1em;">${addr.label || 'Adresse'}</div>
            <div style="margin-bottom: 5px; color: #333;">${addr.firstName || ''} ${addr.lastName || ''}</div>
            <div style="color: #555;">${addr.street}</div>
            <div style="color: #555;">${addr.zip} ${addr.city}</div>
            <div style="color:#777; font-size:0.9em; margin-top: 5px;">${addr.country}</div>
        </div>
    `).join('');
}