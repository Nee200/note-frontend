const API_BASE_URL = 'https://note-backend-5gy0.onrender.com';
let allProducts = [];
let editingProductId = null;

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
        const res = await fetch(API_BASE_URL + '/api/admin/check');
        if (res.ok) {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            loadProducts();
        }
    } catch (e) {
        // Not authorized
    }
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
            const countEl = document.getElementById('search-count');
            if (countEl) countEl.textContent = allProducts.length + ' Produkte';
        }
    } catch (e) {
        console.error('Fehler beim Laden', e);
    }
}

function renderProductTable(productsToRender) {
    if (!productsToRender) productsToRender = allProducts;
    const tbody = document.getElementById('admin-product-list');
    if (!productsToRender.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;padding:2rem;">Keine Treffer gefunden</td></tr>';
        return;
    }
    tbody.innerHTML = productsToRender.map(function (p) {
        var imgSrc = (p.images && p.images.length > 0) ? p.images[0] : 'logo.png';
        var price50 = (p.variants && p.variants['50']) ? p.variants['50'].price.toFixed(2) + ' EUR' : '-';
        return '<tr>' +
            '<td><img src="' + imgSrc + '" onerror="this.src=\'logo.png\'" style="width:40px;height:40px;border-radius:4px;object-fit:cover;"></td>' +
            '<td style="font-weight:500;">' + p.id + '</td>' +
            '<td>' + (p.name || '') + '<br><span style="font-size:0.8rem;color:#888;">' + (p.inspiredBy || '') + '</span></td>' +
            '<td><span class="status-badge success">' + (p.category || '') + '</span></td>' +
            '<td>' + price50 + '</td>' +
            '<td style="white-space:nowrap;">' +
            '<button class="btn-edit" title="Bearbeiten" onclick="editProduct(\'' + p.id + '\')"><i class="fas fa-pen"></i></button>' +
            ' ' +
            '<button class="btn-delete" title="Loeschen" onclick="deleteProduct(\'' + p.id + '\')"><i class="fas fa-trash"></i></button>' +
            '</td></tr>';
    }).join('');
}

function filterAdminProducts() {
    const term = document.getElementById('admin-search').value.toLowerCase().trim();
    const filtered = !term ? allProducts : allProducts.filter(function (p) {
        var nameMatch = p.name ? String(p.name).toLowerCase().includes(term) : false;
        var idMatch = p.id ? String(p.id).toLowerCase().includes(term) : false;
        var inspiredMatch = p.inspiredBy ? String(p.inspiredBy).toLowerCase().includes(term) : false;
        return nameMatch || idMatch || inspiredMatch;
    });
    renderProductTable(filtered);
    const countEl = document.getElementById('search-count');
    if (countEl) {
        countEl.textContent = term ? (filtered.length + ' von ' + allProducts.length + ' Treffern') : (allProducts.length + ' Produkte');
    }
}

// ---- EDIT ----
function editProduct(id) {
    const p = allProducts.find(function (x) { return x.id === id; });
    if (!p) return;

    editingProductId = id;
    document.getElementById('edit-modal-id').textContent = id;
    document.getElementById('edit-name').value = p.name || '';
    document.getElementById('edit-inspired').value = p.inspiredBy || '';
    document.getElementById('edit-description').value = p.description || '';
    document.getElementById('edit-category').value = p.category || 'women';
    document.getElementById('edit-price-30').value = (p.variants && p.variants['30']) ? p.variants['30'].price : '';
    document.getElementById('edit-orig-30').value = (p.variants && p.variants['30'] && p.variants['30'].originalPrice) ? p.variants['30'].originalPrice : '';
    document.getElementById('edit-price-50').value = (p.variants && p.variants['50']) ? p.variants['50'].price : '';
    document.getElementById('edit-orig-50').value = (p.variants && p.variants['50'] && p.variants['50'].originalPrice) ? p.variants['50'].originalPrice : '';

    var statusEl = document.getElementById('edit-status');
    if (statusEl) statusEl.style.display = 'none';

    document.getElementById('editModal').classList.add('open');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('open');
    editingProductId = null;
}

async function saveEdit() {
    if (!editingProductId) return;
    const statusEl = document.getElementById('edit-status');

    const body = {
        name: document.getElementById('edit-name').value,
        inspiredBy: document.getElementById('edit-inspired').value,
        description: document.getElementById('edit-description').value,
        category: document.getElementById('edit-category').value,
        price30: document.getElementById('edit-price-30').value,
        originalPrice30: document.getElementById('edit-orig-30').value,
        price50: document.getElementById('edit-price-50').value,
        originalPrice50: document.getElementById('edit-orig-50').value,
    };

    try {
        const res = await fetch(API_BASE_URL + '/api/admin/products/' + editingProductId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            const data = await res.json();
            // Update local cache
            var idx = allProducts.findIndex(function (p) { return p.id === editingProductId; });
            if (idx !== -1) allProducts[idx] = data.product;
            filterAdminProducts();
            statusEl.textContent = 'Gespeichert!';
            statusEl.style.color = 'green';
            statusEl.style.display = 'block';
            setTimeout(function () { closeEditModal(); }, 1000);
        } else {
            const err = await res.json();
            statusEl.textContent = 'Fehler: ' + (err.error || 'Unbekannt');
            statusEl.style.color = 'red';
            statusEl.style.display = 'block';
        }
    } catch (e) {
        console.error('Speicher-Fehler:', e);
        statusEl.textContent = 'Verbindungsfehler!';
        statusEl.style.color = 'red';
        statusEl.style.display = 'block';
    }
}

// ---- DELETE ----
async function deleteProduct(id) {
    if (!confirm('Bist du sicher, dass du Produkt ' + id + ' dauerhaft loeschen moechtest?')) return;
    try {
        const res = await fetch(API_BASE_URL + '/api/admin/products/' + id, { method: 'DELETE' });
        if (res.ok) {
            allProducts = allProducts.filter(function (p) { return p.id !== id; });
            filterAdminProducts();
            alert('Produkt ' + id + ' wurde geloescht.');
        } else {
            const data = await res.json();
            alert('Fehler: ' + (data.error || 'Unbekannter Fehler'));
        }
    } catch (e) {
        alert('Verbindungsfehler!');
    }
}

// Initial auth check
checkAuth();
