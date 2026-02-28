const API_BASE_URL = 'https://note-backend-5gy0.onrender.com';
// Parfüm Produkte
// Hinweis: Bilder-Dateinamen müssen später angepasst werden, wenn die Dateien im Ordner liegen.
// Schema: 'p1_1.png', 'p1_2.png' etc. oder wie du sie nennst.
let products = [];

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentDiscount = parseFloat(localStorage.getItem('discount')) || 0;
let currentSelectedSize = 50;
let currentListCategory = 'all';
let currentPageIndex = 0;
let currentProductsPerPage = 25;

const productGrid = document.getElementById('product-grid');
const bestsellerWomenGrid = document.getElementById('bestseller-women-grid');
const bestsellerMenGrid = document.getElementById('bestseller-men-grid');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');
const cartCountElement = document.getElementById('cart-count');
const cartSidebar = document.getElementById('cart-sidebar');
const overlay = document.getElementById('overlay');

const bestsellerIds = ['G11', 'G21', 'G28', 'G32', 'L1', 'L5', 'L10', 'L20'];
const bestsellerIdSet = new Set(bestsellerIds);

function isBestseller(product) {
    return bestsellerIdSet.has(product.id);
}

async function init() {
    try {
        const res = await fetch(API_BASE_URL + '/api/products');
        if (res.ok) {
            products = await res.json();
            console.log('Products loaded:', products.length);
        } else {
            console.error('Failed to load products');
        }
    } catch (e) {
        console.error('Error fetching products:', e);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const categoryParam = urlParams.get('category');
    const defaultCategory = document.body ? document.body.dataset.defaultCategory : null;
    const hasProductGrid = !!document.getElementById('product-grid');

    if (productId && products.length > 0) {
        // ID als String behandeln, damit "G1" etc. funktioniert
        renderProductDetail(productId);
    } else {
        if (hasProductGrid) {
            if (categoryParam) {
                renderProducts(categoryParam);
            } else if (defaultCategory) {
                renderProducts(defaultCategory);
            } else {
                renderProducts();
            }
            initProductControls();
        }

        if (bestsellerWomenGrid || bestsellerMenGrid) {
            renderBestsellers();
        }
    }

    initDeliveryTimeline();
    updateCartUI();
    initFAQ();
    initAccordion();
}

// Accordion Initialisierung
function initAccordion() {
    const accordions = document.querySelectorAll('.accordion-header');
    accordions.forEach(acc => {
        acc.addEventListener('click', () => {
            const item = acc.parentElement;

            // Toggle active class
            item.classList.toggle('active');
        });
    });
}

// FAQ Initialisierung
function initFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    if (!faqQuestions.length) return;

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            // Toggle active class
            item.classList.toggle('active');
        });
    });
}



function getProductCardHTML(product) {
    const defaultVariant = product.variants[30];
    const price = defaultVariant.price;
    const originalPrice = defaultVariant.originalPrice;
    const bestsellerFlag = isBestseller(product);

    return `
        <div class="product-card" onclick="window.location.href='product.html?id=${product.id}'">
            <div class="product-image-wrapper">
                <img src="${(product.images && product.images.length > 0) ? product.images[0] : 'logo.png'}" 
                     loading="lazy"
                     alt="${product.name}" 
                     class="product-grid-image product-img-${product.id}"
                     onerror="this.src='logo.png'">
            </div>
            <div class="product-info">
                <h3 class="product-title">
                    ${product.name}
                    ${bestsellerFlag ? '<span class="product-badge-bestseller">Bestseller</span>' : ''}
                </h3>
                ${product.inspiredBy ? `<p class="product-inspired">Inspired by: ${product.inspiredBy.split(' - ')[0]}</p>` : ''}
                <p class="product-short-desc">${product.description}</p>
                <div class="product-actions">
                    <div class="product-price">
                        ${originalPrice ? `<span class="original-price-strike">${originalPrice.toFixed(2)} €</span>` : ''}
                        ab ${price.toFixed(2)} €
                    </div>
                    <button class="btn btn-outlined-card" onclick="event.stopPropagation(); window.location.href='product.html?id=${product.id}'">
                        ZUR AUSWAHL
                    </button>
                </div>
            </div>
        </div>
    `;
}

function getFilteredAndSortedProducts(category) {
    let list = category === 'all'
        ? products
        : products.filter(product => product.category === category);

    const filterInput = document.getElementById('product-filter-input');
    if (filterInput && filterInput.value.trim() !== '') {
        const term = filterInput.value.trim().toLowerCase();
        list = list.filter(p => {
            // Check matches in specific fields
            const nameMatch = p.name.toLowerCase().includes(term);
            const inspiredMatch = p.inspiredBy ? p.inspiredBy.toLowerCase().includes(term) : false;
            const headMatch = p.notes && p.notes.head && p.notes.head.toLowerCase().includes(term);
            const heartMatch = p.notes && p.notes.heart && p.notes.heart.toLowerCase().includes(term);
            const baseMatch = p.notes && p.notes.base && p.notes.base.toLowerCase().includes(term);

            if (currentNoteFilter === 'all') {
                return nameMatch || inspiredMatch || headMatch || heartMatch || baseMatch;
            } else if (currentNoteFilter === 'head') {
                return headMatch;
            } else if (currentNoteFilter === 'heart') {
                return heartMatch;
            } else if (currentNoteFilter === 'base') {
                return baseMatch;
            }
            return false;
        });
    }

    const sortSelect = document.getElementById('product-sort-select');
    if (sortSelect) {
        const value = sortSelect.value;
        const getPrice = (product) => {
            if (!product.variants) return 0;
            const variant = product.variants[50] || product.variants[30] || product.variants[100];
            return variant ? variant.price : 0;
        };

        if (value === 'name-asc') {
            list = list.slice().sort((a, b) => a.name.localeCompare(b.name, 'de', { numeric: true }));
        } else if (value === 'price-asc') {
            list = list.slice().sort((a, b) => getPrice(a) - getPrice(b));
        } else if (value === 'price-desc') {
            list = list.slice().sort((a, b) => getPrice(b) - getPrice(a));
        } else if (value === 'bestseller-first') {
            list = list.slice().sort((a, b) => {
                const aBest = isBestseller(a) ? 1 : 0;
                const bBest = isBestseller(b) ? 1 : 0;
                return bBest - aBest;
            });
        }
    }

    return list;
}

function renderProducts(category = 'all', pageIndex, append = false) {
    if (!productGrid) return;

    if (typeof pageIndex === 'number') {
        currentPageIndex = pageIndex;
    } else if (category !== currentListCategory) {
        currentPageIndex = 0;
    }

    currentListCategory = category;

    const allProductsForView = getFilteredAndSortedProducts(category);

    let limit = currentProductsPerPage;
    if (limit <= 0) {
        limit = allProductsForView.length;
    }

    const maxPageIndex = limit > 0 ? Math.floor(Math.max(allProductsForView.length - 1, 0) / limit) : 0;
    if (currentPageIndex > maxPageIndex) {
        currentPageIndex = 0;
    }

    const start = currentPageIndex * limit;
    const visibleProducts = allProductsForView.slice(start, start + limit);

    if (append) {
        productGrid.insertAdjacentHTML('beforeend', visibleProducts.map(getProductCardHTML).join(''));
    } else {
        productGrid.innerHTML = visibleProducts.map(getProductCardHTML).join('');
    }

    const info = document.getElementById('product-count-info');
    if (info) {
        if (allProductsForView.length === 0) {
            info.textContent = '0 von 0 Düften angezeigt';
        } else {
            const totalVisible = Math.min((currentPageIndex + 1) * limit, allProductsForView.length);
            info.textContent = `1–${totalVisible} von ${allProductsForView.length} Düften angezeigt`;
        }
    }

    const nextBtn = document.getElementById('product-next-page');
    if (nextBtn) {
        if (currentPageIndex < maxPageIndex) {
            nextBtn.disabled = false;
            nextBtn.classList.remove('disabled');
            nextBtn.style.display = '';
        } else {
            nextBtn.disabled = true;
            nextBtn.classList.add('disabled');
            nextBtn.style.display = 'none';
        }
    }
}

function goToNextProductPage() {
    const defaultCategory = document.body ? document.body.dataset.defaultCategory : null;
    const category = (currentListCategory && currentListCategory !== 'all')
        ? currentListCategory
        : (defaultCategory || 'all');

    const allProductsForView = getFilteredAndSortedProducts(category);
    let limit = currentProductsPerPage;

    if (limit <= 0) return;

    const maxPageIndex = Math.floor(Math.max(allProductsForView.length - 1, 0) / limit);
    if (currentPageIndex < maxPageIndex) {
        renderProducts(category, currentPageIndex + 1, true);
    }
}

function initProductControls() {
    const filterInput = document.getElementById('product-filter-input');
    const sortSelect = document.getElementById('product-sort-select');
    const nextBtn = document.getElementById('product-next-page');
    const filterButtons = document.querySelectorAll('.filter-btn');

    if (!filterInput && !sortSelect && !nextBtn && filterButtons.length === 0) return;

    const getCategoryForControls = () => {
        if (currentListCategory && currentListCategory !== 'all') return currentListCategory;
        const defaultCategory = document.body ? document.body.dataset.defaultCategory : null;
        return defaultCategory || 'all';
    };

    if (filterInput) {
        filterInput.addEventListener('input', () => {
            renderProducts(getCategoryForControls(), 0);
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            renderProducts(getCategoryForControls(), 0);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            goToNextProductPage();
        });
    }
}

function getBestsellerProductsForCategory(category) {
    const pool = products.filter(p => isBestseller(p) && p.category === category);
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const maxItems = 3;
    return shuffled.slice(0, Math.min(maxItems, shuffled.length));
}

function renderBestsellers() {
    if (!bestsellerWomenGrid && !bestsellerMenGrid) return;

    if (bestsellerWomenGrid) {
        const womenBestsellers = getBestsellerProductsForCategory('women');
        bestsellerWomenGrid.innerHTML = womenBestsellers.length
            ? womenBestsellers.map(getProductCardHTML).join('')
            : '';
    }

    if (bestsellerMenGrid) {
        const menBestsellers = getBestsellerProductsForCategory('men');
        bestsellerMenGrid.innerHTML = menBestsellers.length
            ? menBestsellers.map(getProductCardHTML).join('')
            : '';
    }
}

// Detailansicht rendern (für product.html)
function renderProductDetail(id) {
    const product = products.find(p => p.id === id);
    if (!product) {
        document.querySelector('.detail-container').innerHTML = '<p>Produkt nicht gefunden.</p>';
        return;
    }

    document.getElementById('detail-title').innerText = product.name;
    const detailBestsellerFlag = document.getElementById('detail-bestseller-flag');
    if (detailBestsellerFlag) {
        if (isBestseller(product)) {
            detailBestsellerFlag.textContent = 'Bestseller';
        } else {
            detailBestsellerFlag.textContent = '';
        }
    }

    // Social Proof Logic (Live Data from Server)
    const viewingCountEl = document.getElementById('viewing-count');
    const cartAddedCountEl = document.getElementById('cart-added-count');
    const socialProofContainer = document.getElementById('social-proof-container');

    if (viewingCountEl && cartAddedCountEl && socialProofContainer) {
        // Animation Helper
        const animateValue = (element, start, end, duration, prefix, suffix) => {
            if (start === end) {
                element.innerHTML = `${prefix}<strong>${end}</strong>${suffix}`;
                return;
            }
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const current = Math.floor(progress * (end - start) + start);
                element.innerHTML = `${prefix}<strong>${current}</strong>${suffix}`;
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        };

        // State to keep track of current displayed values
        let currentViewers = 0;
        let currentCarts = 0;
        let isFirstLoad = true;

        // Function to fetch live stats
        const fetchLiveStats = () => {
            fetch(API_BASE_URL + '/api/view-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id })
            })
                .then(res => res.json())
                .then(data => {
                    // Stable offset based on product ID characters
                    let stableOffset = 0;
                    for (let i = 0; i < product.id.length; i++) {
                        stableOffset += product.id.charCodeAt(i);
                    }
                    stableOffset = (stableOffset % 30) + 15; // Between 15 and 44

                    const targetViewers = data.viewers + stableOffset;
                    const targetCarts = Math.max(2, Math.floor(targetViewers * 0.2) + data.carts);

                    if (isFirstLoad) {
                        // Start animation from 0 or slightly below target
                        // Animation duration 2 seconds for dramatic effect
                        animateValue(viewingCountEl, 0, targetViewers, 2000, '', ' Leute sehen sich gerade das Produkt an');
                        animateValue(cartAddedCountEl, 0, targetCarts, 2000, 'davon ', ' im Warenkorb');
                        isFirstLoad = false;
                    } else {
                        // Smooth transition if value changes
                        if (currentViewers !== targetViewers) {
                            animateValue(viewingCountEl, currentViewers, targetViewers, 1000, '', ' Leute sehen sich gerade das Produkt an');
                        }
                        if (currentCarts !== targetCarts) {
                            animateValue(cartAddedCountEl, currentCarts, targetCarts, 1000, 'davon ', ' im Warenkorb');
                        }
                    }

                    currentViewers = targetViewers;
                    currentCarts = targetCarts;

                    socialProofContainer.style.display = 'flex';
                })
                .catch(err => console.error('Error fetching live stats:', err));
        };

        // Initial fetch
        fetchLiveStats();

        // Poll every 10 seconds
        if (window.productStatsInterval) clearInterval(window.productStatsInterval);
        window.productStatsInterval = setInterval(fetchLiveStats, 10000);
    }

    // Initial Rendern mit Default Größe (50ml)
    updateDetailPrice(product, currentSelectedSize);

    document.getElementById('detail-desc').innerText = product.description;
    document.getElementById('detail-long-desc').innerText = product.longDescription;

    // Duftnoten
    const notesList = document.getElementById('detail-notes');
    if (notesList && product.notes) {
        notesList.innerHTML = `
            <li><strong>Kopfnote:</strong> ${product.notes.head}</li>
            <li><strong>Herznote:</strong> ${product.notes.heart}</li>
            <li><strong>Basisnote:</strong> ${product.notes.base}</li>
        `;
    }

    // Inspired By
    const inspiredByContainer = document.querySelector('.inspired-by');
    if (inspiredByContainer && product.inspiredBy) {
        const parts = product.inspiredBy.split(' - ');
        if (parts.length === 2) {
            inspiredByContainer.innerHTML = `"...${parts[0]}..." <span class="original-price">Originalpreis: ${parts[1]}</span>`;
        } else {
            inspiredByContainer.innerText = product.inspiredBy;
        }
    }

    // Hauptbild
    const mainImg = document.getElementById('detail-main-image');
    const mainImgSrc = (product.images && product.images.length > 0) ? product.images[0] : 'logo.png';
    mainImg.src = mainImgSrc;

    // Thumbnails
    const thumbContainer = document.getElementById('detail-thumbnails');
    if (product.images && product.images.length > 1) {
        thumbContainer.innerHTML = product.images.map((img, index) => `
            <img src="${img}" class="detail-thumbnail ${index === 0 ? 'active' : ''}" 
                 onclick="changeDetailImage('${img}', this)" 
                 onerror="this.style.display='none'">
        `).join('');
    } else {
        thumbContainer.innerHTML = '';
    }

    // Größenauswahl (Buttons in existierende Gruppe rendern)
    const optionGroup = document.querySelector('.option-group');
    if (optionGroup) {
        const sizes = [30, 50];
        optionGroup.innerHTML = sizes.map(size => `
            <button class="option-btn ${size === currentSelectedSize ? 'active' : ''} relative" 
                    onclick="changeSize('${product.id}', ${size})">
                ${size}ml
                ${size === 50 ? '<span class="badge">Bestseller</span>' : ''}
            </button>
        `).join('');
    }

    // Falls wir das alte Element noch irgendwo haben (Cleanup)
    const oldContainer = document.getElementById('size-selection-container');
    if (oldContainer) oldContainer.remove();

    // Add Button
    document.getElementById('detail-add-btn').onclick = () => {
        addToCart(product.id, currentSelectedSize);
    };

    // Remove old event listeners logic as we now generate onclick inline or above
    // (The previous block looping over option-btn is now redundant/conflicting if we replace innerHTML)
}

// Größe ändern
function changeSize(productId, size) {
    currentSelectedSize = size;
    const product = products.find(p => p.id === productId);

    // UI Update Buttons
    // Update active class in option-group
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
        // Simple check if button text starts with size
        if (btn.innerText.includes(size + 'ml')) {
            btn.classList.add('active');
            // Badge color update handled by CSS (.option-btn.active .badge)
        } else {
            btn.classList.remove('active');
        }
    });

    // Preis Update
    updateDetailPrice(product, size);

    // Update Add to Cart Button Logic
    const addBtn = document.getElementById('detail-add-btn');
    if (addBtn) {
        addBtn.onclick = () => {
            addToCart(productId, size);
        };
    }
}

function updateDetailPrice(product, size) {
    const variant = product.variants[size];
    if (!variant) return;

    const priceElement = document.getElementById('detail-price');
    const basePrice = (variant.price / size) * 100;
    const basePriceFormatted = basePrice.toFixed(2).replace('.', ',') + ' € / 100 ml';

    let priceHTML = '';

    // Originalpreis anzeigen falls vorhanden
    if (variant.originalPrice) {
        priceHTML += `<span class="detail-original-price">${variant.originalPrice.toFixed(2)} €</span>`;
    }

    priceHTML += `<span class="detail-current-price">${variant.price.toFixed(2)} €</span>`;
    priceHTML += `<div class="base-price">${basePriceFormatted}</div>`;
    priceHTML += `<div class="tax-info">inkl. MwSt., zzgl. <a href="#shipping">Versand</a></div>`;

    priceElement.innerHTML = priceHTML;
}

function initDeliveryTimeline() {
    const orderedEl = document.getElementById('delivery-ordered-date');
    const shippedEl = document.getElementById('delivery-shipped-range');
    const deliveredEl = document.getElementById('delivery-delivered-range');

    if (!orderedEl || !shippedEl || !deliveredEl) return;

    const today = new Date();

    orderedEl.innerText = 'Heute';

    function addDays(baseDate, days) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + days);
        return d;
    }

    function formatDayMonth(date) {
        const day = date.getDate();
        const monthName = date.toLocaleString('de-DE', { month: 'long' });
        return day + '. ' + monthName;
    }

    const shippedStart = addDays(today, 1);
    const shippedEnd = addDays(today, 3);
    const deliveredStart = addDays(today, 3);
    const deliveredEnd = addDays(today, 5);

    shippedEl.innerText = formatDayMonth(shippedStart) + ' - ' + formatDayMonth(shippedEnd);
    deliveredEl.innerText = formatDayMonth(deliveredStart) + ' - ' + formatDayMonth(deliveredEnd);

    const timeline = document.querySelector('.delivery-timeline');
    if (timeline) {
        requestAnimationFrame(() => {
            timeline.classList.add('delivery-timeline-visible');
        });
    }
}

// Bild in Detailansicht wechseln
function changeDetailImage(src, thumbnail) {
    document.getElementById('detail-main-image').src = src;
    document.querySelectorAll('.detail-thumbnail').forEach(t => t.classList.remove('active'));
    thumbnail.classList.add('active');
}



// Zum Warenkorb hinzufügen
function addToCart(productId, size = 50) {
    const product = products.find(p => p.id === productId);
    const variant = product.variants[size];

    // Eindeutige ID für den Warenkorb (z.B. "1-50")
    const cartItemId = `${productId}-${size}`;

    const existingItem = cart.find(item => item.cartId === cartItemId);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        // Nutze das erste Bild als Vorschaubild im Warenkorb, oder Fallback
        const cartImage = (product.images && product.images.length > 0) ? product.images[0] : 'logo.png';

        cart.push({
            cartId: cartItemId, // Interne ID für Warenkorb
            id: product.id + (variant.idSuffix || `-${size}`), // ID für Server/Stripe (z.B. "1-50" oder "G1-50")
            productId: product.id, // Referenz zum Hauptprodukt
            name: `${product.name} (${size}ml)`,
            price: variant.price,
            size: size,
            quantity: 1,
            image: cartImage
        });
    }

    updateCartUI();

    // Open cart automatically
    if (!cartSidebar.classList.contains('open')) {
        toggleCart();
    }
}

// Aus dem Warenkorb entfernen
function removeFromCart(cartItemId) {
    cart = cart.filter(item => item.cartId !== cartItemId);
    updateCartUI();
}

// Warenkorb UI aktualisieren
function updateCartUI() {
    // 1. Counter Update
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.innerText = totalItems;

    // Header Count Update
    const headerCount = document.getElementById('cart-count-header');
    if (headerCount) headerCount.innerText = totalItems;

    // Save state
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('discount', currentDiscount);

    // 2. Items rendern
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-msg" style="padding: 1.5rem; text-align: center; color: #666;">Ihr Warenkorb ist leer.</p>';
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image || 'logo.png'}" alt="${item.name}" onerror="this.src='logo.png'">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-variant">${item.size}ml</div>
                    <div class="quantity-control">
                        <button class="qty-btn" onclick="changeQuantity('${item.cartId}', -1)">−</button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="qty-btn" onclick="changeQuantity('${item.cartId}', 1)">+</button>
                    </div>
                </div>
                <div class="cart-item-right">
                    <button class="delete-btn" onclick="removeFromCart('${item.cartId}')">
                        <i class="far fa-trash-alt"></i>
                    </button>
                    <div class="item-price">${(item.price * item.quantity).toFixed(2)} €</div>
                </div>
            </div>
        `).join('');
    }

    // 3. Berechnungen (Subtotal, Discount, Shipping, Total)
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = subtotal * currentDiscount;
    const shippingThreshold = 50.00;
    let shippingCost = 0;

    // Kostenloser Versand Logik
    const remainingForFreeShipping = shippingThreshold - subtotal;
    const shippingMessage = document.getElementById('shipping-message');
    const shippingBar = document.getElementById('shipping-progress-bar');

    if (shippingMessage && shippingBar) {
        if (remainingForFreeShipping <= 0) {
            shippingMessage.innerHTML = '<strong>Kostenloser Versand!</strong>';
            shippingBar.style.width = '100%';
            shippingCost = 0;
        } else {
            shippingMessage.innerText = `Noch ${remainingForFreeShipping.toFixed(2)} € bis zu kostenlosem Versand`;
            const percentage = Math.min(100, (subtotal / shippingThreshold) * 100);
            shippingBar.style.width = `${percentage}%`;
            shippingCost = 4.90; // Standard shipping cost
        }
    }

    const total = subtotal - discountAmount + (remainingForFreeShipping <= 0 ? 0 : shippingCost);

    // 4. Footer Values Update
    const subtotalEl = document.getElementById('cart-subtotal');
    const discountRow = document.getElementById('discount-row');
    const discountEl = document.getElementById('cart-discount-amount');
    const shippingEl = document.getElementById('cart-shipping-cost');
    const totalEl = document.getElementById('cart-total');

    if (subtotalEl) subtotalEl.innerText = subtotal.toFixed(2) + ' €';

    if (discountRow && discountEl) {
        if (currentDiscount > 0) {
            discountRow.style.display = 'flex';
            discountEl.innerText = '-' + discountAmount.toFixed(2) + ' €';
        } else {
            discountRow.style.display = 'none';
        }
    }

    if (shippingEl) {
        shippingEl.innerText = remainingForFreeShipping <= 0 ? 'Kostenlos' : shippingCost.toFixed(2) + ' €';
    }

    if (totalEl) totalEl.innerText = total.toFixed(2) + ' €';

    // 5. Sync Coupon UI State
    const input = document.getElementById('coupon-code');
    const message = document.getElementById('coupon-message');
    const btn = document.querySelector('.coupon-input-group button');

    if (input && message && btn && currentDiscount > 0) {
        input.value = 'Deniz10';
        input.disabled = true;
        btn.disabled = true;
        btn.innerText = '✓';
        message.textContent = 'Gutschein aktiviert (-10%)';
        message.className = 'coupon-message success';
    }

    // 6. Update Upsell
    updateUpsell();
}

// Menge ändern (+/-)
function changeQuantity(cartId, delta) {
    const item = cart.find(i => i.cartId === cartId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(cartId);
        } else {
            updateCartUI();
        }
    }
}

// Upsell Logik (Zeige ein Produkt, das nicht im Warenkorb ist)
function updateUpsell() {
    const container = document.getElementById('upsell-container');
    if (!container) return;

    // Finde ein Produkt, das nicht im Warenkorb ist (check based on productId to avoid showing same perfume different size)
    const availableUpsells = products.filter(p => !cart.find(c => c.productId === p.id));

    if (availableUpsells.length > 0) {
        // Nimm das erste verfügbare oder zufällig
        const upsellProduct = availableUpsells[0];
        // Standardmäßig 50ml Preis anzeigen für Upsell
        const upsellPrice = upsellProduct.variants[50].price;

        container.innerHTML = `
            <div class="upsell-card">
                <img src="${(upsellProduct.images && upsellProduct.images.length > 0) ? upsellProduct.images[0] : 'logo.png'}" 
                     class="upsell-img" 
                     alt="${upsellProduct.name}"
                     onerror="this.src='logo.png'">
                <div class="upsell-info">
                    <div class="upsell-title">${upsellProduct.name}</div>
                    <div class="upsell-price">${upsellPrice.toFixed(2)} €</div>
                </div>
                <button class="upsell-add-btn" onclick="addToCart('${upsellProduct.id}', 50)">Hinzufügen</button>
            </div>
        `;
    } else {
        // Fallback, wenn alle Produkte im Warenkorb sind (z.B. Zubehör anzeigen oder ausblenden)
        container.innerHTML = '<p style="font-size:0.9rem; color:#666;">Alle Düfte im Warenkorb!</p>';
    }
}

// Timer Logik
let timerInterval;
function startCartTimer() {
    const timerEl = document.getElementById('cart-timer');
    if (!timerEl) return;

    // Reset Timer auf 10 Minuten
    let duration = 60 * 10;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;

        timerEl.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (--duration < 0) {
            clearInterval(timerInterval);
            timerEl.innerText = "00:00";
            // Optional: Warenkorb leeren oder Warnung anzeigen
        }
    }, 1000);
}

// Start Timer beim Laden
startCartTimer();


// Gutschein anwenden
function applyCoupon() {
    const input = document.getElementById('coupon-code');
    const message = document.getElementById('coupon-message');
    const btn = document.querySelector('.coupon-input-group button');

    if (!input || !message) return;

    const code = input.value.trim();

    if (code.toLowerCase() === 'deniz10') {
        currentDiscount = 0.10;
        message.textContent = 'Gutschein erfolgreich aktiviert (-10%)';
        message.className = 'coupon-message success';

        input.disabled = true;
        btn.disabled = true;
        btn.innerText = '✓';
    } else {
        currentDiscount = 0;
        message.textContent = 'Der Gutscheincode ist ungültig.';
        message.className = 'coupon-message error';
    }

    updateCartUI();
}

// Warenkorb Toggle (Öffnen/Schließen)
function toggleCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('overlay');

    if (cartSidebar.classList.contains('open')) {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('open');
        document.body.classList.remove('no-scroll');
        document.body.style.overflow = ''; // Zur Sicherheit Inline-Style entfernen
    } else {
        if (cartSidebar) cartSidebar.classList.add('open');
        if (cartOverlay) cartOverlay.classList.add('open');
        document.body.classList.add('no-scroll');
    }
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('mobile-active');
}

// Suche

// Checkout (Dummy)
async function checkout() {
    // 1. Prüfe, ob der Warenkorb leer ist
    if (cart.length === 0) {
        alert('Ihr Warenkorb ist leer!');
        return;
    }

    let customerEmail = null;

    // Versuche, die E-Mail des eingeloggten Users zu holen
    try {
        const userRes = await fetch(API_BASE_URL + '/api/user');
        if (userRes.ok) {
            const userData = await userRes.json();
            customerEmail = userData.user.email;
        }
    } catch (e) {
        // Nicht eingeloggt oder Fehler, fahre als Gast fort
        console.log('Checkout als Gast (oder Auth-Check fehlgeschlagen)');
    }

    // 2. Stripe Session erstellen (Server anfunken)
    // Wir senden jetzt den gesamten Warenkorb (items: cart)
    const cartItems = cart.map(item => ({
        id: item.id, // e.g. "1-50"
        quantity: item.quantity
    }));

    const body = { items: cartItems };
    if (customerEmail) {
        body.customerEmail = customerEmail;
    }

    try {
        const response = await fetch(API_BASE_URL + '/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Netzwerk-Antwort war nicht ok');
        }

        const data = await response.json();

        // 3. Weiterleitung zu Stripe
        if (data.url) {
            window.location.href = data.url;
        } else {
            console.error('Keine URL erhalten:', data);
            alert('Fehler bei der Weiterleitung zu Stripe.');
        }
    } catch (error) {
        console.error('Fehler beim Checkout:', error);
        alert('Es gab ein Problem beim Starten des Bezahlvorgangs: ' + error.message);
    }
}

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
    }
}

// Close search when clicking outside
document.addEventListener('click', (e) => {
    const searchOverlay = document.getElementById('search-overlay');
    const searchWrapper = document.querySelector('.search-wrapper'); // Includes icon and overlay

    if (searchOverlay && searchOverlay.classList.contains('open')) {
        // If click is outside the search wrapper (which contains both icon and overlay)
        if (searchWrapper && !searchWrapper.contains(e.target)) {
            // Check if it's not the close button (handled by toggleSearch)
            toggleSearch();
        }
    }
});

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
        resultsContainer.innerHTML = '<p class="no-results" style="grid-column: 1/-1; text-align: center; color: #666;">Keine Düfte gefunden.</p>';
        return;
    }

    resultsContainer.innerHTML = filteredProducts.map(product => {
        const defaultVariant = product.variants[30] || product.variants[50];
        const price = defaultVariant ? defaultVariant.price : 0;
        const inspiredByShort = product.inspiredBy ? product.inspiredBy.split(' - ')[0] : '';

        return `
        <div class="product-card" onclick="window.location.href='product.html?id=${product.id}'" style="cursor: pointer;">
            <div class="product-image-wrapper">
                <img src="${(product.images && product.images.length > 0) ? product.images[0] : 'logo.png'}" 
                     alt="${product.name}" 
                     class="product-grid-image"
                     onerror="this.style.display='none'">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                ${inspiredByShort ? `<p class="product-inspired-search">Inspired by: ${inspiredByShort}</p>` : ''}
                <div class="product-price">ab ${price.toFixed(2)} €</div>
            </div>
        </div>
    `}).join('');
}


// Intro Text Functionality (Inline Expansion)
let originalIntroText = '';

function initIntroText() {
    const introTextElement = document.getElementById('collection-intro-text');
    if (!introTextElement) return;

    // Capture original text once
    if (!originalIntroText) {
        originalIntroText = introTextElement.innerText.trim();
    }

    if (window.innerWidth <= 768) {
        // Mobile: Show truncated text with "Mehr lesen"
        const splitPhrase = 'Jede Kreation';
        const splitIndex = originalIntroText.indexOf(splitPhrase);

        if (splitIndex !== -1) {
            // If we are not already in "expanded" state, truncate
            if (!introTextElement.classList.contains('expanded')) {
                // Ensure we don't re-truncate if already truncated (check for link)
                if (!introTextElement.innerHTML.includes('expandIntroText')) {
                    const visibleText = originalIntroText.substring(0, splitIndex);
                    introTextElement.innerHTML = `${visibleText} <span class="read-more-link" onclick="window.expandIntroText(event)" style="color: #d4af37; cursor: pointer; text-decoration: underline; font-weight: 500;">Mehr lesen...</span>`;
                }
            }
        }
    } else {
        // Desktop: Restore full text
        // We check if it differs to avoid unnecessary DOM updates
        if (introTextElement.innerHTML !== originalIntroText && !introTextElement.querySelector('.read-more-link')) {
            // If it was expanded or truncated, restore original
            introTextElement.innerHTML = originalIntroText;
            introTextElement.classList.remove('expanded');
        } else if (introTextElement.querySelector('.read-more-link')) {
            // If it was truncated (from mobile state), restore original
            introTextElement.innerHTML = originalIntroText;
        }
    }
}

// Expose to window for inline onclick access
function expandIntroText(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const introTextElement = document.getElementById('collection-intro-text');
    if (introTextElement) {
        // Simply set the text to original, effectively expanding it
        introTextElement.innerHTML = originalIntroText;
        introTextElement.classList.add('expanded');
    }
}

// Ensure init is called
document.addEventListener('DOMContentLoaded', initIntroText);
// Also try immediately (useful if script is at end of body)
initIntroText();

// Add resize listener to handle orientation changes or window resizing
window.addEventListener('resize', initIntroText);


function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}
// Alias for HTML onclick
window.closeModal = closeProductModal;

// Start
init();
initIntroText(); // Run on startup

// Close modal when clicking outside
window.addEventListener('click', function (event) {
    const productModal = document.getElementById('product-modal');
    if (productModal && event.target === productModal) {
        closeProductModal();
    }
});

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.toggleCart = toggleCart;
window.checkout = checkout;
window.changeDetailImage = changeDetailImage;
// window.filterProducts = filterProducts; // removed as not defined
window.applyCoupon = applyCoupon;
window.toggleSearch = toggleSearch;
window.performSearch = performSearch;
window.expandIntroText = expandIntroText;
window.closeProductModal = closeProductModal;
