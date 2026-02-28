const API_BASE_URL = 'https://note-backend-5gy0.onrender.com';
let allProducts = [];
let editingProductId = null;
let selectedIds = new Set(); // Persists selections across search re-renders

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
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#888;padding:2rem;">Keine Treffer gefunden</td></tr>';
        return;
    }
    tbody.innerHTML = productsToRender.map(function (p) {
        var imgSrc = (p.images && p.images.length > 0) ? p.images[0] : 'logo.png';
        var price50 = (p.variants && p.variants['50']) ? p.variants['50'].price.toFixed(2) + ' EUR' : '-';
        var isChecked = selectedIds.has(p.id) ? ' checked' : '';
        return '<tr>' +
            '<td><input type="checkbox" class="product-cb" data-id="' + p.id + '"' + isChecked + ' onchange="onCheckboxChange(this)"></td>' +
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
    updateBulkPanel();
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
    // Do NOT reset selections when searching - user may be building a cross-search selection
}

// ---- BULK SELECTION ----
function onCheckboxChange(cb) {
    // Sync individual checkbox change into the persistent Set
    if (cb) {
        if (cb.checked) {
            selectedIds.add(cb.dataset.id);
        } else {
            selectedIds.delete(cb.dataset.id);
        }
    }
    updateBulkPanel();
}

function updateBulkPanel() {
    var panel = document.getElementById('bulk-panel');
    var label = document.getElementById('bulk-count-label');
    var statusEl = document.getElementById('bulk-status');
    var chipsEl = document.getElementById('bulk-chips');
    if (statusEl) statusEl.style.display = 'none';

    if (selectedIds.size > 0) {
        panel.style.display = 'block';
        label.textContent = selectedIds.size + ' ausgewaehlt';

        // Show ID chips if 10 or fewer selected
        if (chipsEl) {
            var ids = Array.from(selectedIds);
            if (ids.length <= 10) {
                chipsEl.innerHTML = ids.map(function (id) {
                    return '<span style="' +
                        'display:inline-flex;align-items:center;gap:4px;' +
                        'background:#f0f4ff;color:#1a73e8;border:1px solid #c5d8fb;' +
                        'border-radius:20px;padding:2px 10px 2px 10px;font-size:0.78rem;font-weight:600;' +
                        '">' + id +
                        '<span onclick="deselectId(\'' + id + '\')" style="cursor:pointer;font-size:0.9rem;color:#888;margin-left:2px;" title="Entfernen">&times;</span>' +
                        '</span>';
                }).join(' ');
                chipsEl.style.display = 'flex';
            } else {
                chipsEl.innerHTML = '';
                chipsEl.style.display = 'none';
            }
        }
    } else {
        panel.style.display = 'none';
    }
}

function getSelectedIds() {
    return Array.from(selectedIds);
}

function deselectId(id) {
    selectedIds.delete(id);
    // Also uncheck the visible checkbox if present
    var cb = document.querySelector('.product-cb[data-id="' + id + '"]');
    if (cb) cb.checked = false;
    updateBulkPanel();
}

function selectAll(checked) {
    if (checked) {
        // Add all CURRENTLY VISIBLE products to selection
        var cbs = document.querySelectorAll('.product-cb');
        cbs.forEach(function (cb) { selectedIds.add(cb.dataset.id); cb.checked = true; });
    } else {
        // Clear everything
        selectedIds.clear();
        var cbs = document.querySelectorAll('.product-cb');
        cbs.forEach(function (cb) { cb.checked = false; });
    }
    var masterCb = document.getElementById('select-all-cb');
    if (masterCb) masterCb.checked = checked;
    updateBulkPanel();
}

async function applyBulkUpdate() {
    var ids = getSelectedIds();
    if (ids.length === 0) return;

    var price30 = document.getElementById('bulk-price-30').value;
    var price50 = document.getElementById('bulk-price-50').value;
    var orig30 = document.getElementById('bulk-orig-30').value;
    var orig50 = document.getElementById('bulk-orig-50').value;

    if (price30 === '' && price50 === '' && orig30 === '' && orig50 === '') {
        alert('Bitte mindestens ein Preisfeld ausfullen!');
        return;
    }

    var confirmMsg = ids.length + ' Produkte werden geaendert. Bist du sicher?';
    if (!confirm(confirmMsg)) return;

    var statusEl = document.getElementById('bulk-status');
    statusEl.style.display = 'inline';
    statusEl.style.color = '#888';
    statusEl.textContent = 'Wird gespeichert...';

    try {
        var res = await fetch(API_BASE_URL + '/api/admin/products-bulk', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: ids, price30: price30, price50: price50, originalPrice30: orig30, originalPrice50: orig50 })
        });
        if (res.ok) {
            var data = await res.json();
            statusEl.style.color = '#27ae60';
            statusEl.textContent = data.updated + ' Produkte erfolgreich aktualisiert!';
            selectedIds.clear();
            await loadProducts();
        } else {
            var err = await res.json();
            statusEl.style.color = '#e74c3c';
            statusEl.textContent = 'Fehler: ' + (err.error || 'Unbekannt');
        }
    } catch (e) {
        statusEl.style.color = '#e74c3c';
        statusEl.textContent = 'Verbindungsfehler!';
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

// ---- ADD NEW PRODUCT ----

// Figure out the next free ID for a given category
// e.g. men → finds highest G-number → returns G261
function suggestNextId(category) {
    var catProducts = allProducts.filter(function (p) { return p.category === category; });
    if (!catProducts.length) return '';

    var best = { prefix: '', num: 0 };
    catProducts.forEach(function (p) {
        var match = p.id.match(/^([A-Za-z]+)(\d+)$/);
        if (match) {
            var num = parseInt(match[2], 10);
            if (num > best.num) {
                best = { prefix: match[1].toUpperCase(), num: num };
            }
        }
    });

    return best.prefix ? best.prefix + (best.num + 1) : '';
}

function openAddModal() {
    // Clear all fields
    ['add-id', 'add-name', 'add-inspired', 'add-description', 'add-image1', 'add-image2',
        'add-note-head', 'add-note-heart', 'add-note-base',
        'add-price-30', 'add-orig-30', 'add-price-50', 'add-orig-50'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
        });
    document.getElementById('add-category').value = 'women';
    var statusEl = document.getElementById('add-status');
    if (statusEl) statusEl.style.display = 'none';

    // Auto-suggest next ID for default category
    var suggested = suggestNextId('women');
    var idField = document.getElementById('add-id');
    if (idField && suggested) idField.value = suggested;

    document.getElementById('addModal').classList.add('open');
}

// Called when category dropdown changes – only updates ID if it still matches a suggestion
function onAddCategoryChange() {
    var category = document.getElementById('add-category').value;
    var idField = document.getElementById('add-id');
    var currentVal = idField.value.trim();

    // Only overwrite if the field is empty OR still holds an auto-suggested value
    // (i.e. it matches the pattern ^[A-Z]+\d+$ and belongs to one of the categories)
    var isAutoSuggested = /^[A-Z]+\d+$/.test(currentVal) &&
        ['men', 'women', 'unisex'].some(function (cat) {
            return suggestNextId(cat) === currentVal;
        });

    if (!currentVal || isAutoSuggested) {
        var suggested = suggestNextId(category);
        if (suggested) idField.value = suggested;
    }
}

function closeAddModal() {
    document.getElementById('addModal').classList.remove('open');
}

async function saveNewProduct() {
    var statusEl = document.getElementById('add-status');
    statusEl.style.display = 'none';

    var id = document.getElementById('add-id').value.trim().toUpperCase();
    var name = document.getElementById('add-name').value.trim();
    var price30 = document.getElementById('add-price-30').value;
    var price50 = document.getElementById('add-price-50').value;

    // Validation
    if (!id) { showAddStatus('Produkt-ID ist Pflicht!', 'red'); return; }
    if (!name) { showAddStatus('Name ist Pflicht!', 'red'); return; }
    if (!price30 && !price50) { showAddStatus('Mindestens ein Preis muss angegeben werden!', 'red'); return; }
    if (allProducts.find(function (p) { return p.id.toUpperCase() === id; })) {
        showAddStatus('ID "' + id + '" existiert bereits! Bitte eine andere waehlen.', 'red');
        return;
    }

    var images = [];
    var img1 = document.getElementById('add-image1').value.trim();
    var img2 = document.getElementById('add-image2').value.trim();
    if (img1) images.push(img1);
    if (img2) images.push(img2);

    var body = {
        id: id,
        name: name,
        category: document.getElementById('add-category').value,
        inspiredBy: document.getElementById('add-inspired').value.trim(),
        description: document.getElementById('add-description').value.trim(),
        images: images,
        notes: {
            head: document.getElementById('add-note-head').value.trim(),
            heart: document.getElementById('add-note-heart').value.trim(),
            base: document.getElementById('add-note-base').value.trim()
        },
        variants: {
            30: price30 ? { price: parseFloat(price30), originalPrice: parseFloat(document.getElementById('add-orig-30').value) || null } : undefined,
            50: price50 ? { price: parseFloat(price50), originalPrice: parseFloat(document.getElementById('add-orig-50').value) || null } : undefined
        }
    };

    showAddStatus('Wird angelegt...', '#888');
    try {
        var res = await fetch(API_BASE_URL + '/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            var data = await res.json();
            showAddStatus('Parfum "' + name + '" erfolgreich angelegt!', '#27ae60');
            allProducts.unshift(data.product); // Add to top of list
            filterAdminProducts();
            setTimeout(function () { closeAddModal(); }, 1500);
        } else {
            var err = await res.json();
            showAddStatus('Fehler: ' + (err.error || 'Unbekannt'), 'red');
        }
    } catch (e) {
        showAddStatus('Verbindungsfehler!', 'red');
    }
}

function showAddStatus(msg, color) {
    var el = document.getElementById('add-status');
    el.textContent = msg;
    el.style.color = color;
    el.style.display = 'block';
}

// Initial auth check
checkAuth();
