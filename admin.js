const API_BASE_URL = 'https://note-backend-5gy0.onrender.com';
let allProducts = [];

async function login() {
    const pw = document.getElementById('admin-pw').value;
    try {
        const res = await fetch(API_BASE_URL + '/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pw })
        });

        if (res.ok) {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            loadProducts();
        } else {
            document.getElementById('login-err').style.display = 'block';
        }
    } catch (e) {
        console.error('Login error', e);
        alert('Server Fehler beim Login!');
    }
}

async function checkAuth() {
    try {
        const res = await fetch(API_BASE_URL + '/api/admin/check', { ...getFetchConfig() });
        if (res.ok) {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            loadProducts();
        }
    } catch (e) {
        // Not authorized, show login
    }
}

function getFetchConfig() {
    return { credentials: 'omit' }; // To be updated if using cookies
}

function switchTab(tab) {
    document.getElementById('tab-products').style.display = tab === 'products' ? 'block' : 'none';
    document.getElementById('tab-orders').style.display = tab === 'orders' ? 'block' : 'none';
}

function logout() {
    fetch(API_BASE_URL + '/api/admin/logout', { method: 'POST' }).then(() => {
        window.location.reload();
    });
}

async function loadProducts() {
    try {
        const res = await fetch(API_BASE_URL + '/api/products');
        if (res.ok) {
            allProducts = await res.json();
            renderProductTable();
        }
    } catch (e) {
        console.error('Fehler beim Laden', e);
    }
}

function renderProductTable(productsToRender = allProducts) {
    const tbody = document.getElementById('admin-product-list');
    tbody.innerHTML = productsToRender.map(p => `
        <tr>
            <td><img src="${(p.images && p.images.length > 0) ? p.images[0] : 'logo.png'}" alt="${p.id}" onerror="this.src='logo.png'" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;"></td>
            <td style="font-weight: 500;">${p.id}</td>
            <td>${p.name} <br><span style="font-size: 0.8rem; color: #888;">${p.inspiredBy || ''}</span></td>
            <td><span class="status-badge success">${p.category}</span></td>
            <td>
                <button class="btn" style="padding: 0.3rem 0.8rem; font-size: 0.8rem; margin-right: 5px;">Bearbeiten</button>
                <button class="btn" style="padding: 0.3rem 0.8rem; font-size: 0.8rem; background: #e74c3c;" onclick="deleteProduct('${p.id}')">Löschen</button>
            </td>
        </tr>
    `).join('');
}

function filterAdminProducts() {
    const term = document.getElementById('admin-search').value.toLowerCase();
    const filtered = allProducts.filter(p => {
        const nameMatch = p.name ? String(p.name).toLowerCase().includes(term) : false;
        const idMatch = p.id ? String(p.id).toLowerCase().includes(term) : false;
        const inspiredMatch = p.inspiredBy ? String(p.inspiredBy).toLowerCase().includes(term) : false;
        return nameMatch || idMatch || inspiredMatch;
    });
    renderProductTable(filtered);
}

function openAddModal() {
    document.getElementById('productFormModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('productFormModal').style.display = 'none';
}

function saveProduct() {
    alert('Datenbank-Speicherung kommt im nächsten Update!');
    closeModal();
}

async function deleteProduct(id) {
    if (!confirm('Bist du sicher, dass du das Produkt ' + id + ' dauerhaft aus der Datenbank löschen möchtest?')) {
        return;
    }

    try {
        const res = await fetch(API_BASE_URL + '/api/admin/products/' + id, {
            method: 'DELETE',
            ...getFetchConfig()
        });

        if (res.ok) {
            // Remove from local array
            allProducts = allProducts.filter(p => p.id !== id);
            // Re-render table keeping search filter if active
            filterAdminProducts();
            alert('Produkt ' + id + ' wurde erfolgreich gelöscht.');
        } else {
            const data = await res.json();
            alert('Fehler beim Löschen: ' + (data.error || 'Unbekannter Fehler'));
        }
    } catch (e) {
        console.error('Lösch-Fehler:', e);
        alert('Ein Fehler ist aufgetreten. Server erreichbar?');
    }
}

// Initial check when page loads
checkAuth();
