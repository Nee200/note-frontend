
// Search Functionality
function toggleSearch() {
    const searchOverlay = document.getElementById('search-overlay');
    if (!searchOverlay) return; // Safety check
    
    searchOverlay.classList.toggle('open');
    if (searchOverlay.classList.contains('open')) {
        setTimeout(() => {
            const input = document.getElementById('search-input');
            if (input) input.focus();
        }, 100);
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
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
        resultsContainer.innerHTML = '<p class="no-results">Keine Düfte gefunden.</p>';
        return;
    }
    
    resultsContainer.innerHTML = filteredProducts.map(product => `
        <div class="search-result-item" onclick="window.location.href='product.html?id=${product.id}'">
            <img src="${product.images[0]}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
        </div>
    `).join('');
}
