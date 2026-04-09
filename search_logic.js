// Search Functionality
function toggleSearch() {
    const searchOverlay = document.getElementById('search-overlay');
    if (!searchOverlay) return;

    searchOverlay.classList.toggle('open');
    if (searchOverlay.classList.contains('open')) {
        setTimeout(() => {
            const input = document.getElementById('search-input');
            if (input) input.focus();
        }, 100);
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

function performSearch() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const resultsContainer = document.getElementById('search-results');

    if (!resultsContainer) return;

    if (query.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        (product.longDescription && product.longDescription.toLowerCase().includes(query)) ||
        (product.inspiredBy && product.inspiredBy.toLowerCase().includes(query)) ||
        (product.notes && Object.values(product.notes).some(note => note.toLowerCase().includes(query)))
    );

    if (filteredProducts.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">Keine Duefte gefunden.</p>';
        return;
    }

    const escapeHtml = (value) => String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const safeImageSrc = (value) => {
        const raw = String(value || '').trim();
        if (!raw) return 'logo.webp';
        const lowered = raw.toLowerCase();
        if (lowered.startsWith('javascript:') || lowered.startsWith('data:')) return 'logo.webp';
        return escapeHtml(raw);
    };

    resultsContainer.innerHTML = filteredProducts.map(product => `
        <div class="search-result-item" onclick="window.location.href='product.html?id=${encodeURIComponent(String(product.id || ''))}'">
            <img src="${safeImageSrc(product.images && product.images[0])}" alt="${escapeHtml(product.name)}">
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(product.description)}</p>
        </div>
    `).join('');
}
