const API_BASE_URL = (() => {
    const localHosts = new Set(['localhost', '127.0.0.1']);
    if (localHosts.has(window.location.hostname)) {
        return 'http://localhost:4242';
    }
    return 'https://note-backend-5gy0.onrender.com';
})();
// Ans Window haengen, damit style-wave-home.js es wiederverwenden kann
// (verhindert "Identifier has already been declared", wenn beide Skripte geladen werden).
window.API_BASE_URL = API_BASE_URL;

const CSRF_COOKIE_NAME = 'csrf_token';
const nativeFetch = window.fetch.bind(window);
let csrfBootstrapPromise = null;
let csrfTokenMemory = '';

function getCookieValue(name) {
    const prefix = `${name}=`;
    const entry = document.cookie.split('; ').find(part => part.startsWith(prefix));
    return entry ? decodeURIComponent(entry.slice(prefix.length)) : '';
}

function getReadableCsrfToken() {
    return getCookieValue(CSRF_COOKIE_NAME) || csrfTokenMemory;
}

function getStoredUserAuthToken() {
    try {
        return String(localStorage.getItem('user_auth_token') || '').trim();
    } catch (error) {
        return '';
    }
}

function isApiRequestUrl(url) {
    return typeof url === 'string' && (url.startsWith(API_BASE_URL) || url.startsWith('/'));
}

async function ensureCsrfTokenCookie() {
    let token = getReadableCsrfToken();
    if (token) return token;

    if (!csrfBootstrapPromise) {
        csrfBootstrapPromise = nativeFetch(API_BASE_URL + '/api/csrf-token', {
            method: 'GET',
            credentials: 'include'
        })
            .then(async (response) => {
                if (!response.ok) return;
                const payload = await response.json().catch(() => null);
                if (payload && typeof payload.csrfToken === 'string' && payload.csrfToken.trim()) {
                    csrfTokenMemory = payload.csrfToken.trim();
                }
            })
            .catch(() => {
                // handled by caller
            })
            .finally(() => {
                csrfBootstrapPromise = null;
            });
    }

    await csrfBootstrapPromise;
    return getReadableCsrfToken();
}

window.fetch = async function patchedFetch(resource, options = {}) {
    const requestUrl = typeof resource === 'string' ? resource : resource && resource.url;
    const requestMethod = String(
        options.method || (resource && resource.method) || 'GET'
    ).toUpperCase();
    const apiRequest = isApiRequestUrl(requestUrl);

    if (apiRequest && !options.credentials) {
        options = {
            ...options,
            credentials: 'include'
        };
    }

    if (apiRequest) {
        const headers = new Headers(resource && resource.headers ? resource.headers : undefined);
        if (options.headers) {
            new Headers(options.headers).forEach((value, key) => headers.set(key, value));
        }
        if (!headers.has('Authorization')) {
            const authToken = getStoredUserAuthToken();
            if (authToken) {
                headers.set('Authorization', `Bearer ${authToken}`);
            }
        }
        options = {
            ...options,
            headers
        };
    }

    if (!['GET', 'HEAD', 'OPTIONS'].includes(requestMethod) && apiRequest) {
        const csrfToken = await ensureCsrfTokenCookie();
        if (csrfToken) {
            const headers = new Headers(resource && resource.headers ? resource.headers : undefined);
            if (options.headers) {
                new Headers(options.headers).forEach((value, key) => headers.set(key, value));
            }
            headers.set('X-CSRF-Token', csrfToken);
            options = {
                ...options,
                credentials: options.credentials || 'include',
                headers
            };
        }
    }

    return nativeFetch(resource, options);
};

function persistCouponState() {
    localStorage.setItem('discount', String(currentDiscount || 0));
    localStorage.setItem('couponCode', currentCouponCode);
    localStorage.setItem('couponLabel', currentCouponLabel);
    localStorage.setItem('couponFreeShipping', currentCouponFreeShipping ? '1' : '0');
}

function clearCouponState() {
    currentDiscount = 0;
    currentCouponCode = '';
    currentCouponLabel = '';
    currentCouponFreeShipping = false;
    localStorage.removeItem('discount');
    localStorage.removeItem('couponCode');
    localStorage.removeItem('couponLabel');
    localStorage.removeItem('couponFreeShipping');
}

window.addEventListener('note:coupon-removed', () => {
    clearCouponState();
    updateCartUI();
});

async function syncUserLoginIndicator() {
    const userIcons = document.querySelectorAll('.user-icon');
    if (!userIcons.length) return;

    try {
        const response = await fetch(API_BASE_URL + '/api/user', {
            credentials: 'include'
        });
        const isLoggedIn = response.ok;

        userIcons.forEach((icon) => {
            icon.classList.toggle('logged-in', isLoggedIn);
            icon.setAttribute(
                'aria-label',
                isLoggedIn ? 'Mein Konto, angemeldet' : 'Mein Konto'
            );
        });
    } catch (error) {
        userIcons.forEach((icon) => {
            icon.classList.remove('logged-in');
            icon.setAttribute('aria-label', 'Mein Konto');
        });
    }
}
// Parfüm Produkte
// Hinweis: Bilder-Dateinamen müssen später angepasst werden, wenn die Dateien im Ordner liegen.
// Schema: 'p1_1.webp', 'p1_2.webp' etc. oder wie du sie nennst.
let products = [];
let productsLoadPromise = null;

function normalizeNewArrivalPrices(items) {
    return items.map((product) => {
        if (product?.newArrival !== true || !product.variants?.['30']) return product;
        return {
            ...product,
            variants: {
                ...product.variants,
                '30': { ...product.variants['30'], price: 19.99 }
            }
        };
    });
}

function hydrateProductsFromCache() {
    try {
        const cachedProducts = sessionStorage.getItem('note_products_v2');
        if (!cachedProducts) return false;
        const parsed = JSON.parse(cachedProducts);
        if (!Array.isArray(parsed)) return false;
        products = normalizeNewArrivalPrices(parsed);
        return true;
    } catch (error) {
        return false;
    }
}

async function fetchAndStoreProducts() {
    const res = await fetch(API_BASE_URL + '/api/products');
    if (!res.ok) {
        throw new Error('Failed to load products');
    }
    const data = await res.json();
    if (Array.isArray(data)) {
        products = normalizeNewArrivalPrices(data);
        sessionStorage.setItem('note_products_v2', JSON.stringify(products));
    }
    return products;
}

async function ensureProductsLoaded({ forceRefresh = false, background = false } = {}) {
    if (!forceRefresh && Array.isArray(products) && products.length > 0) {
        return products;
    }

    if (!forceRefresh && hydrateProductsFromCache()) {
        if (!background) {
            // Cache sofort nutzen, aber still im Hintergrund aktualisieren.
            ensureProductsLoaded({ forceRefresh: true, background: true }).catch(() => { });
        }
        return products;
    }

    if (!forceRefresh && productsLoadPromise) {
        return productsLoadPromise;
    }

    productsLoadPromise = fetchAndStoreProducts()
        .catch((error) => {
            if (!background) {
                console.error('Error loading products:', error);
            }
            throw error;
        })
        .finally(() => {
            productsLoadPromise = null;
        });

    return productsLoadPromise;
}

// Includes spelling variants and abbreviations found in the supplier catalogue.
// Long aliases are checked first so "Van Cleef & Arpels" wins over "Van Cleef".
const PRODUCT_BRAND_ALIASES = [
    "Abdul Samad Al Qurashi", "Maison Francis Kurkdjian", "Jean Paul Gaultier", "Jean Paul Gaulter",
    "Marc-Antonie Barrois", "Stephane Humbert Lucas", "Van Cleef & Arpels", "Escentric Molecules",
    "Molecules Escentric", "Salvatore Ferragamo", "Parfums de Marly", "Parfum De Marly",
    "Parfum de Marly", "Yves Saint Laurent", "Narciso Rodriguez", "Carolina Herrera",
    "Caronlina Herrera", "Christian Clive", "Clive Christian", "Collection Prestige",
    "Dolce & Gabbana", "Giorgio Armani", "Giorgo Armani", "Thierry Mugler", "Roberto Cavalli",
    "Zadig & Voltaire", "Franck Olivier", "Frederic Malle", "Jacques Bogart", "Britney Spears",
    "Priscilla Presley", "Juliette Has A Gun", "Victoria Secret", "Acqua di Parma", "Arabian Oud",
    "Bottega Veneta", "Calvin Klein", "Narciso", "Maison Crivelli", "Maison Margiela",
    "Maison Alhambra", "Tiziana Terenzi", "Tiziana Terenzi", "Viktor & Rolf", "Viktor Rolf",
    "Victor Rolf", "Paco Rabanne", "Paco Rabbane", "Ard Al Zaafaran", "Ard Al Khaleej",
    "Al Jazeera Perfumes", "Al Jaezeera", "Maison Alhambra", "Michael Kors", "Milton Llyod",
    "Franck Olivier", "Franco Ferre", "Marc Jacobs", "Nina Ricci", "Issey Miyake", "Issey Miake",
    "Jo Malone", "Jimmy Choo", "Elie Saab", "Estee Lauder", "Hugo Boss", "Tom Ford",
    "Louis Vuitton", "Nina Ricci", "Jil Sander", "Ted Lapidus", "KayAli", "Khadlaj",
    "D´Hermés", "Hermés", "Hermès", "Hermes", "Guerlain", "Baccarat", "Bulgari", "Bvlgari",
    "Afnan", "Azzaro", "Aramis", "Bois 1920", "Cacharel", "Cartier", "Chanel", "Chopard", "Chloe",
    "Creed", "Davidoff", "Diesel", "Dior", "Diptyque", "DKNY", "Dunhill", "Eisenberg", "Ex Nihilo",
    "Escada", "Fendi", "Gisada", "Gisah", "Givenchy", "Gucci", "Initio", "Joop!", "Joop",
    "Hummer", "Kajal", "Kenzo", "Kilian", "Killian", "Lacoste", "Lancome", "Lancôme", "Lattafa", "Lattfa", "Le Labo",
    "Mancera", "Malizia Uomo", "Montale", "Montblanc", "Mugler", "Nasomatto", "Nautica",
    "Nikos", "Nishane", "Orlane", "Orto Parisi", "Paris Hilton", "Penhaligon", "Prada",
    "Rasai", "Rasasi", "Roja", "Rochas", "Sospiro", "Terenzi", "Thameen", "Trussardi", "Valentino",
    "Versace", "Vertus", "Widian", "Xerjoff", "Yves Rocher", "Zarko Perfume", "Casamorati",
    "Amouage", "Ajmal", "Atkinson", "Bond No 9", "Burberry", "Byredo", "Memo Paris",
    "Molecules", "MFK", "JPG", "Jpg", "T.F.", "YSL", "D&G", "BLV", "CH", "PR", "LB", "Lv",
    "Armani", "Boss", "Yves"
].sort((a, b) => b.length - a.length);

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Removes real manufacturer names while preserving the perfume name shown after the ellipsis.
function stripBrandName(name) {
    if (!name) return '';

    let cleaned = String(name).split(/\s+-\s+/).slice(-1)[0].trim();
    const separator = "[\\s\\-–—/:|·'’´]+";

    // Multiple passes handle combinations such as "Bulgari Bvlgari Le Gemme Tygar".
    for (let pass = 0; pass < 4; pass += 1) {
        const beforePass = cleaned;

        for (const brand of PRODUCT_BRAND_ALIASES) {
            const escapedBrand = escapeRegExp(brand);
            const prefix = new RegExp(`^${escapedBrand}(?:${separator}|$)`, 'i');
            const suffix = new RegExp(`(?:${separator}|^)${escapedBrand}$`, 'i');
            const embedded = new RegExp(`(^|${separator})${escapedBrand}(?=${separator}|$)`, 'i');

            if (prefix.test(cleaned)) {
                cleaned = cleaned.replace(prefix, '').trim();
            } else if (suffix.test(cleaned)) {
                cleaned = cleaned.replace(suffix, '').trim();
            } else if (embedded.test(cleaned)) {
                cleaned = cleaned.replace(embedded, '$1').trim();
            }
        }

        cleaned = cleaned
            .replace(/^[\s\-–—/:|·'’´]+|[\s\-–—/:|·'’´]+$/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
        if (cleaned === beforePass) break;
    }

    return cleaned || 'Duftkomposition';
}

function sanitizeProductUrlId(value) {
    return encodeURIComponent(String(value || ''));
}

function sanitizeClassFragment(value) {
    return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '');
}

function safeImageSrc(value) {
    const raw = String(value || '').trim();
    if (!raw) return 'logo.webp';
    const lowered = raw.toLowerCase();
    if (lowered.startsWith('javascript:') || lowered.startsWith('data:')) {
        return 'logo.webp';
    }
    return escapeHtml(raw);
}

function normalizeSearchText(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function matchesSearchValue(value, queryNormalized) {
    if (!queryNormalized) return true;
    return normalizeSearchText(value).includes(queryNormalized);
}

function matchesProductSearch(product, queryRaw) {
    const queryNormalized = normalizeSearchText(queryRaw);
    if (!queryNormalized) return true;

    const noteValues = product && product.notes ? Object.values(product.notes) : [];

    return (
        matchesSearchValue(product && product.name, queryNormalized) ||
        matchesSearchValue(product && product.description, queryNormalized) ||
        matchesSearchValue(product && product.longDescription, queryNormalized) ||
        matchesSearchValue(product && product.inspiredBy, queryNormalized) ||
        noteValues.some((note) => matchesSearchValue(note, queryNormalized))
    );
}

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentDiscount = parseFloat(localStorage.getItem('discount')) || 0;
let currentCouponCode = localStorage.getItem('couponCode') || '';
let currentCouponLabel = localStorage.getItem('couponLabel') || '';
let currentCouponFreeShipping = localStorage.getItem('couponFreeShipping') === '1';
const STRIPE_PENDING_CHECKOUT_KEY = 'stripe_checkout_pending';
let couponStateSynced = false;
let currentDeliveryMethod = 'shipping';
let currentSelectedSize = 50;
let currentListCategory = 'all';
let currentPageIndex = 0;
let currentProductsPerPage = 25;
let currentNoteFilter = 'all';
let cartScrollLockY = 0;

function syncNewArrivalCartPrices() {
    if (!Array.isArray(cart) || !cart.length || !Array.isArray(products) || !products.length) return;

    const newArrivalsById = new Map(
        products
            .filter((product) => product?.newArrival === true)
            .map((product) => [String(product.id), product])
    );
    let changed = false;

    cart.forEach((item) => {
        const productId = String(item.productId || String(item.id || '').replace(/-\d+$/, ''));
        const size = String(item.size || '').replace(/[^0-9]/g, '');
        if (size !== '30') return;

        const variant = newArrivalsById.get(productId)?.variants?.['30'];
        if (!variant) return;

        const nextPrice = Number(variant.price);
        const nextOriginalPrice = Number(variant.originalPrice);
        if (Number.isFinite(nextPrice) && Number(item.price) !== nextPrice) {
            item.price = nextPrice;
            changed = true;
        }
        if (Number.isFinite(nextOriginalPrice) && Number(item.originalPrice) !== nextOriginalPrice) {
            item.originalPrice = nextOriginalPrice;
            changed = true;
        }
    });

    if (changed) localStorage.setItem('cart', JSON.stringify(cart));
}

if (currentDiscount > 0 && !currentCouponCode) {
    currentDiscount = 0;
    currentCouponLabel = '';
    currentCouponFreeShipping = false;
    localStorage.removeItem('discount');
    localStorage.removeItem('couponCode');
    localStorage.removeItem('couponLabel');
    localStorage.removeItem('couponFreeShipping');
}

function clearCartState() {
    cart = [];
    clearCouponState();
    localStorage.removeItem('cart');
    updateCartUI();
}

function handleCheckoutReturnState() {
    const path = String(window.location.pathname || '').toLowerCase();
    const isSuccessPage = path.endsWith('/success.html') || path.endsWith('success.html');
    const isCancelPage = path.endsWith('/cancel.html') || path.endsWith('cancel.html');

    if (isCancelPage) {
        sessionStorage.removeItem(STRIPE_PENDING_CHECKOUT_KEY);
        return;
    }

    if (!isSuccessPage) return;

    const params = new URLSearchParams(window.location.search || '');
    const isPickup = params.get('pickup') === 'true' || sessionStorage.getItem('isPickupOrder') === 'true';
    const hadStripePending = sessionStorage.getItem(STRIPE_PENDING_CHECKOUT_KEY) === '1';

    if (isPickup || hadStripePending) {
        clearCartState();
    }

    sessionStorage.removeItem('isPickupOrder');
    sessionStorage.removeItem(STRIPE_PENDING_CHECKOUT_KEY);
}

function initBrandVideoAutoplay() {
    const videos = Array.from(document.querySelectorAll('video.brand-video'));
    if (!videos.length) return;

    const tryPlay = () => {
        videos.forEach((video) => {
            video.muted = true;
            video.setAttribute('muted', '');
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => { });
            }
        });
    };

    tryPlay();
    document.addEventListener('touchstart', tryPlay, { once: true, passive: true });
    document.addEventListener('click', tryPlay, { once: true, passive: true });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') tryPlay();
    });
}

const productGrid = document.getElementById('product-grid');
const bestsellerWomenGrid = document.getElementById('bestseller-women-grid');
const bestsellerMenGrid = document.getElementById('bestseller-men-grid');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');
const cartCountElement = document.getElementById('cart-count');
const cartSidebar = document.getElementById('cart-sidebar');
const overlay = document.getElementById('overlay');

// Bestseller wird jetzt direkt aus dem Datenbankfeld product.bestseller gelesen
function isBestseller(product) {
    return product.bestseller === true;
}

// Die kuratierte Auswahl entspricht exakt den beiden Bestseller-Reihen auf
// der Startseite. Sie ist bewusst unabhängig vom Datenbankfeld `bestseller`,
// damit Kategorie- und Startseite immer dieselben Favoriten zeigen.
const CURATED_BESTSELLER_IDS = Object.freeze({
    women: Object.freeze(['L12', 'L56', 'L62', 'L73', 'L123', 'L145', 'L146', 'L147', 'L155', 'L190']),
    men: Object.freeze(['G111', 'G160', 'G169', 'G223', 'G232', 'G245', 'G263', 'G282', 'G298', 'G307', 'G322'])
});

const CURATED_BESTSELLER_ID_SET = new Set([
    ...CURATED_BESTSELLER_IDS.women,
    ...CURATED_BESTSELLER_IDS.men
]);

function isCuratedBestseller(product) {
    return CURATED_BESTSELLER_ID_SET.has(String(product?.id || '').toUpperCase());
}

function getCuratedBestsellerRank(product) {
    const category = product?.category === 'men' ? 'men' : 'women';
    return CURATED_BESTSELLER_IDS[category].indexOf(String(product?.id || '').toUpperCase());
}

function scrollToSearchResultsIfNeeded(query) {
    if (!query) return;
    const productGridEl = document.getElementById('product-grid');
    if (!productGridEl) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const navbar = document.querySelector('.navbar');
    const topBanner = document.querySelector('.top-banner');
    const offset = (navbar ? navbar.getBoundingClientRect().height : 0)
        + (topBanner ? topBanner.getBoundingClientRect().height : 0)
        + 110;

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const targetTop = Math.max(
                productGridEl.getBoundingClientRect().top + window.pageYOffset - offset,
                0
            );
            window.scrollTo({
                top: targetTop,
                behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });
        });
    });
}

async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const categoryParam = urlParams.get('category');
    const sortParam = urlParams.get('sort');
    const defaultCategory = document.body ? document.body.dataset.defaultCategory : null;
    const hasProductGrid = !!document.getElementById('product-grid');
    const needsProductsForInitialRender = Boolean(
        productId ||
        hasProductGrid ||
        bestsellerWomenGrid ||
        bestsellerMenGrid
    );

    if (needsProductsForInitialRender) {
        try {
            await ensureProductsLoaded();
            // Die Neuheiten-Seite darf nicht mit einem älteren Session-Cache leer
            // gerendert werden. Falls der Cache noch keine Neuheiten kennt, warten
            // wir einmal auf die aktuellen API-Daten, bevor die Karten entstehen.
            if (defaultCategory === 'new' && !products.some(product => product.newArrival === true)) {
                await ensureProductsLoaded({ forceRefresh: true });
            }
            // Produktseiten neuer Düfte sollen nach Galerie-/Noten-Updates nicht
            // einmalig mit einem älteren Session-Cache gerendert werden.
            const requestedProduct = productId
                ? products.find(product => String(product.id) === String(productId))
                : null;
            if (requestedProduct?.newArrival === true) {
                await ensureProductsLoaded({ forceRefresh: true });
            }
        } catch (error) {
            console.error('Error in init logic:', error);
        }
    } else {
        // Nicht-blockierend im Hintergrund aufwärmen (bessere Suche/Produktwechsel später).
        ensureProductsLoaded({ background: true }).catch(() => { });
    }

    syncNewArrivalCartPrices();

    if (productId && products.length > 0) {
        // ID als String behandeln, damit "G1" etc. funktioniert
        renderProductDetail(productId);
    } else {
        const isSearchPage = document.body && document.body.dataset.page === 'search';
        let searchQueryParam = '';
        if (hasProductGrid) {
            const sortSelect = document.getElementById('product-sort-select');
            if (sortParam === 'bestseller' && sortSelect) {
                sortSelect.value = 'bestseller-first';
            }
            if (isSearchPage) {
                const q = new URLSearchParams(window.location.search).get('q');
                searchQueryParam = String(q || '').trim();
                const filterInput = document.getElementById('product-filter-input');
                if (searchQueryParam && filterInput) {
                    filterInput.value = searchQueryParam;
                    const searchTitle = document.getElementById('search-page-title');
                    if(searchTitle) searchTitle.innerText = `Ergebnisse für "${q}"`;
                }
                const searchSubtitle = document.getElementById('search-page-subtitle');
                if(searchSubtitle) searchSubtitle.style.display = 'none';
            }
            if (categoryParam) {
                renderProducts(categoryParam);
            } else if (defaultCategory) {
                renderProducts(defaultCategory);
            } else {
                renderProducts();
            }
            initProductControls();
            if (isSearchPage) {
                scrollToSearchResultsIfNeeded(searchQueryParam);
            }
        }

        if (bestsellerWomenGrid || bestsellerMenGrid) {
            renderBestsellers();
        }
    }

    initDeliveryTimeline();
    await syncStoredCouponState();
    updateCartUI();
    initFAQ();
    initAccordion();
}

async function syncStoredCouponState() {
    if (couponStateSynced) return;
    couponStateSynced = true;

    if (!currentCouponCode) return;

    try {
        const res = await fetch(API_BASE_URL + '/api/validate-coupon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: currentCouponCode })
        });
        if (!res.ok) return;

        const data = await res.json();
        if (!data.valid) {
            clearCouponState();
            return;
        }

        currentDiscount = Number(data.discount || 0) / 100;
        currentCouponCode = data.code || currentCouponCode;
        currentCouponLabel = data.label || `${data.discount}% Rabatt`;
        currentCouponFreeShipping = data.freeShipping === true;
        persistCouponState();
    } catch (e) {
        // Keep existing local state if sync temporarily fails.
    }
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



function getProductCardHTML(product, options = {}) {
    const imageLoading = options.imageLoading || 'lazy';
    const imageFetchPriority = options.imageFetchPriority || 'auto';
    const defaultVariant = product.variants[30];
    const price = defaultVariant.price;
    const originalPrice = defaultVariant.originalPrice;
    const safeProductUrlId = sanitizeProductUrlId(product.id);
    const safeProductClassId = sanitizeClassFragment(product.id);
    const safeImage = safeImageSrc((product.images && product.images.length > 0) ? product.images[0] : 'logo.webp');
    const safeProductName = escapeHtml(product.name || '');
    const safeProductCode = escapeHtml(String(product.name || '').replace(/\s*\(\d+ml\)/, '').replace(/^No\.\s*/i, ''));
    const hasComparisonImage = safeImage.includes('images_website/bestsellers/');
    const safeInspiredBy = product.inspiredBy
        ? `...${escapeHtml(stripBrandName(product.inspiredBy))}&reg;`
        : safeProductName;
    const formattedPrice = price.toFixed(2).replace('.', ',');
    const formattedOriginalPrice = originalPrice
        ? originalPrice.toFixed(2).replace('.', ',')
        : '';

    return `
        <a class="product-card shop-product-card${isCuratedBestseller(product) ? ' is-bestseller' : ''}${hasComparisonImage ? ' has-comparison-image' : ''}" href="product.html?id=${safeProductUrlId}" aria-label="N&Oslash;TE. ${safeProductCode} ansehen">
            ${isCuratedBestseller(product) ? '<span class="product-badge-bestseller">Bestseller</span>' : ''}
            <span class="product-code">N&Oslash;TE. ${safeProductCode}</span>
            <div class="product-stage">
                <img src="${safeImage}" 
                     alt="${safeProductName}" 
                     class="product-grid-image product-img-${safeProductClassId}"
                     loading="${imageLoading}"
                     decoding="async"
                     fetchpriority="${imageFetchPriority}"
                     onerror="this.src='logo.webp'">
            </div>
            <div class="product-copy">
                <h3 class="product-title">${safeInspiredBy}</h3>
                <div class="product-price">
                    ${originalPrice ? `<s>${formattedOriginalPrice} &euro;</s>` : ''}
                    <span>ab ${formattedPrice} &euro;</span>
                </div>
            </div>
        </a>
    `;
}

let productImagePreloadObserver = null;

function primeProductGridImages(grid) {
    if (!grid) return;

    if (productImagePreloadObserver) {
        productImagePreloadObserver.disconnect();
        productImagePreloadObserver = null;
    }

    const pendingImages = Array.from(
        grid.querySelectorAll('.shop-product-card .product-grid-image[loading="lazy"]')
    ).filter(image => !image.complete);

    if (!pendingImages.length) return;

    const loadImageNow = (image) => {
        image.loading = 'eager';
        if (typeof image.decode === 'function') {
            image.decode().catch(() => { });
        }
    };

    if (!('IntersectionObserver' in window)) {
        pendingImages.forEach(loadImageNow);
        return;
    }

    productImagePreloadObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            loadImageNow(entry.target);
            observer.unobserve(entry.target);
        });
    }, {
        root: null,
        rootMargin: '1800px 0px',
        threshold: 0.01
    });

    pendingImages.forEach(image => productImagePreloadObserver.observe(image));
}

const BESTSELLER_INSPIRATION_IMAGES = Object.freeze({
    L37: 'images_website/bestsellers/l37-comparison-transparent-v3.webp',
    L93: 'images_website/bestsellers/l93-comparison-transparent-v1.webp',
    L95: 'images_website/bestsellers/l95-comparison-transparent-v1.webp',
    L12: 'images_website/bestsellers/l12-comparison-transparent-v2.webp',
    L56: 'images_website/bestsellers/l56-comparison-transparent-v2.webp',
    L62: 'images_website/bestsellers/l62-comparison-transparent-v2.webp',
    L73: 'images_website/bestsellers/l73-comparison-transparent-v2.webp',
    L123: 'images_website/bestsellers/l123-comparison-transparent-v2.webp',
    L145: 'images_website/bestsellers/l145-comparison-transparent-v2.webp',
    L146: 'images_website/bestsellers/l146-comparison-transparent-v2.webp',
    L147: 'images_website/bestsellers/l147-comparison-transparent-v2.webp',
    L155: 'images_website/bestsellers/l155-comparison-transparent-v2.webp',
    L190: 'images_website/bestsellers/l190-comparison-transparent-v2.webp',
    G111: 'images_website/bestsellers/g111-comparison-transparent-v1.webp',
    G160: 'images_website/bestsellers/g160-comparison-transparent-v2.webp',
    G169: 'images_website/bestsellers/g169-comparison-transparent-v2.webp',
    G223: 'images_website/bestsellers/g223-comparison-transparent-v1.webp',
    G232: 'images_website/bestsellers/g232-comparison-transparent-v1.webp',
    G245: 'images_website/bestsellers/g245-comparison-transparent-v1.webp',
    G263: 'images_website/bestsellers/g263-comparison-transparent-v1.webp',
    G282: 'images_website/bestsellers/g282-comparison-transparent-v1.webp',
    G298: 'images_website/bestsellers/g298-comparison-transparent-v1.webp',
    G307: 'images_website/bestsellers/g307-comparison-transparent-v2.webp',
    G322: 'images_website/bestsellers/g322-comparison-transparent-v2.webp'
});

const PRODUCT_DETAIL_INFOGRAPHIC_IMAGE = 'images_website/product-details/note-product-infographic-v1.webp';

function getProductGalleryImages(product) {
    const productImages = Array.isArray(product?.images)
        ? product.images.map(image => String(image || '').trim()).filter(Boolean)
        : [];

    // Neuheiten enthalten ihre bewusst sortierte Dreier-Galerie direkt in den
    // Produktdaten: Vergleich, Einzelflakon und Explosionsbild.
    if (product?.newArrival === true && productImages.length) {
        return [...new Set(productImages)];
    }

    const inspirationImage = BESTSELLER_INSPIRATION_IMAGES[String(product?.id || '')];
    const galleryImages = inspirationImage
        ? [inspirationImage, ...productImages.filter(image => image !== inspirationImage)]
        : (productImages.length ? [...productImages] : ['logo.webp']);
    const infographicPosition = inspirationImage ? 2 : 1;

    galleryImages.splice(
        Math.min(infographicPosition, galleryImages.length),
        0,
        PRODUCT_DETAIL_INFOGRAPHIC_IMAGE
    );

    return [...new Set(galleryImages)];
}

function getFilteredAndSortedProducts(category) {
    let list;
    if (category === 'all') {
        list = products;
    } else if (category === 'new') {
        list = products.filter(product => product.newArrival === true);
        const selectedGender = document.body ? document.body.dataset.newArrivalView : '';
        if (selectedGender === 'men' || selectedGender === 'women') {
            list = list.filter(product => product.category === selectedGender);
        }
    } else {
        list = products.filter(product => product.category === category);
    }

    const filterInput = document.getElementById('product-filter-input');
    if (filterInput && filterInput.value.trim() !== '') {
        const termRaw = filterInput.value.trim();
        const termNormalized = normalizeSearchText(termRaw);
        list = list.filter(p => {
            // Fehlertolerante Suche (z.B. "no 5" trifft auch "No. 5")
            const nameMatch = matchesSearchValue(p.name, termNormalized);
            const inspiredMatch = matchesSearchValue(p.inspiredBy, termNormalized);
            const headMatch = matchesSearchValue(p.notes && p.notes.head, termNormalized);
            const heartMatch = matchesSearchValue(p.notes && p.notes.heart, termNormalized);
            const baseMatch = matchesSearchValue(p.notes && p.notes.base, termNormalized);

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
                const aRank = getCuratedBestsellerRank(a);
                const bRank = getCuratedBestsellerRank(b);

                if (aRank !== -1 || bRank !== -1) {
                    if (aRank === -1) return 1;
                    if (bRank === -1) return -1;
                    return aRank - bRank;
                }

                return String(a.id || '').localeCompare(String(b.id || ''), 'de', {
                    numeric: true,
                    sensitivity: 'base'
                });
            });
        } else if (value === 'women-first') {
            list = list.slice().sort((a, b) =>
                (a.category === 'women' ? -1 : 1) - (b.category === 'women' ? -1 : 1)
            );
        } else if (value === 'men-first') {
            list = list.slice().sort((a, b) =>
                (a.category === 'men' ? -1 : 1) - (b.category === 'men' ? -1 : 1)
            );
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
        productGrid.insertAdjacentHTML('beforeend', visibleProducts.map((product) => (
            getProductCardHTML(product, { imageLoading: 'lazy', imageFetchPriority: 'auto' })
        )).join(''));
    } else {
        productGrid.innerHTML = visibleProducts.map((product, index) => (
            getProductCardHTML(product, {
                imageLoading: index < 4 ? 'eager' : 'lazy',
                imageFetchPriority: index < 2 ? 'high' : 'auto'
            })
        )).join('');
    }

    primeProductGridImages(productGrid);

    const info = document.getElementById('product-count-info');
    if (info) {
        if (allProductsForView.length === 0) {
            info.textContent = '0 von 0 Düften angezeigt';
        } else {
            const totalVisible = Math.min((currentPageIndex + 1) * limit, allProductsForView.length);
            info.textContent = `1–${totalVisible} von ${allProductsForView.length} Düften angezeigt`;
        }
    }

    const newArrivalFilterStatus = document.querySelector('[data-new-arrival-filter-status]');
    if (newArrivalFilterStatus && category === 'new') {
        const selectedGender = document.body ? document.body.dataset.newArrivalView : 'all';
        if (selectedGender === 'men') {
            newArrivalFilterStatus.textContent = `${allProductsForView.length} neue Herrend\u00fcfte ausgew\u00e4hlt.`;
        } else if (selectedGender === 'women') {
            newArrivalFilterStatus.textContent = `${allProductsForView.length} neue Damend\u00fcfte ausgew\u00e4hlt.`;
        } else {
            newArrivalFilterStatus.textContent = `Alle ${allProductsForView.length} Neuheiten werden angezeigt. W\u00e4hle deine Duftwelt.`;
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
    const newArrivalGenderButtons = document.querySelectorAll('[data-new-arrival-gender]');

    if (!filterInput && !sortSelect && !nextBtn && filterButtons.length === 0 && newArrivalGenderButtons.length === 0) return;

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

    if (newArrivalGenderButtons.length > 0) {
        newArrivalGenderButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const requestedGender = button.dataset.newArrivalGender;
                if (requestedGender !== 'men' && requestedGender !== 'women') return;

                const currentGender = document.body ? document.body.dataset.newArrivalView : 'all';
                const nextGender = currentGender === requestedGender ? 'all' : requestedGender;
                if (document.body) document.body.dataset.newArrivalView = nextGender;

                newArrivalGenderButtons.forEach((item) => {
                    const isActive = item.dataset.newArrivalGender === nextGender;
                    item.classList.toggle('is-active', isActive);
                    item.setAttribute('aria-pressed', String(isActive));
                });

                renderProducts(getCategoryForControls(), 0);

                const productsSection = document.getElementById('products');
                if (productsSection) {
                    const header = document.querySelector('.site-header');
                    const offset = (header ? header.getBoundingClientRect().height : 0) + 28;
                    const top = Math.max(productsSection.getBoundingClientRect().top + window.pageYOffset - offset, 0);
                    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                    window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
                }
            });
        });
    }
}

function getBestsellerProductsForCategory(category) {
    const pool = products.filter(p => p.bestseller === true && p.category === category);
    return [...pool].sort(() => 0.5 - Math.random());
}

function renderBestsellers() {
    if (!bestsellerWomenGrid && !bestsellerMenGrid) return;
    const INITIAL_COUNT = 3;

    function buildGrid(grid, items) {
        if (!grid || !items.length) return;
        const visible = items.slice(0, INITIAL_COUNT);
        const hidden = items.slice(INITIAL_COUNT);

        grid.innerHTML = visible.map((product, index) => (
            getProductCardHTML(product, {
                imageLoading: index < 2 ? 'eager' : 'lazy',
                imageFetchPriority: index === 0 ? 'high' : 'auto'
            })
        )).join('');

        // Remove existing "Weitere" button directly after this grid (if any)
        const existingBtn = grid.nextElementSibling;
        if (existingBtn && existingBtn.classList.contains('product-pagination')) {
            existingBtn.remove();
        }

        // Only add button if there are more items
        if (hidden.length > 0) {
            const btn = document.createElement('div');
            btn.className = 'bestseller-more-wrap';
            btn.innerHTML = `
                <button class="bestseller-more-btn">
                    <span>Alle Bestseller anzeigen</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>`;
            grid.after(btn);

            btn.querySelector('button').addEventListener('click', () => {
                grid.insertAdjacentHTML('beforeend', hidden.map((product) => (
                    getProductCardHTML(product, { imageLoading: 'lazy', imageFetchPriority: 'auto' })
                )).join(''));
                btn.remove();
            });
        }
    }

    if (bestsellerWomenGrid) buildGrid(bestsellerWomenGrid, getBestsellerProductsForCategory('women'));
    if (bestsellerMenGrid) buildGrid(bestsellerMenGrid, getBestsellerProductsForCategory('men'));
}

let currentReviewProductId = '';
let currentReviewRating = 0;
let currentReviewUser = null;

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getProductSeoName(product) {
    return String(product && product.name ? product.name : '')
        .replace(/\s*\(\d+ml\)/, '')
        .trim();
}

function getProductCategoryLabel(product) {
    return product && product.category === 'women' ? 'Damenduft' : 'Herrenduft';
}

function truncateSeoText(value, maxLength = 155) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (text.length <= maxLength) return text;
    const shortened = text.slice(0, maxLength - 1).trim();
    return shortened.replace(/\s+\S*$/, '') + '...';
}

function getProductCanonicalUrl(product) {
    const url = new URL('/product.html', 'https://www.note-fragrances.de');
    url.searchParams.set('id', String(product && product.id ? product.id : ''));
    return url.href;
}

function getProductImageUrl(product) {
    const image = product && Array.isArray(product.images) && product.images.length > 0
        ? String(product.images[0] || '').trim()
        : 'logo.webp';
    try {
        return new URL(image || 'logo.webp', 'https://www.note-fragrances.de/').href;
    } catch (error) {
        return 'https://www.note-fragrances.de/logo.webp';
    }
}

function getProductSeoDescription(product) {
    const name = getProductSeoName(product);
    const category = getProductCategoryLabel(product);
    const inspiredBy = stripBrandName(product && product.inspiredBy ? product.inspiredBy : '');
    const dupePart = inspiredBy ? ` Duftalternative zu ${inspiredBy}.` : '';
    return truncateSeoText(`${name} von N\u00d8TE. fragrances: langanhaltender ${category} als Extrait de Parfum mit 40% Duft\u00f6lanteil.${dupePart}`);
}

function upsertMeta(selector, createAttributes, content) {
    let element = document.head.querySelector(selector);
    if (!element) {
        element = document.createElement('meta');
        Object.entries(createAttributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        document.head.appendChild(element);
    }
    element.setAttribute('content', content);
}

function upsertCanonical(href) {
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
    }
    link.setAttribute('href', href);
}

function upsertProductJsonLd(product, title, description, canonicalUrl, imageUrl) {
    let script = document.getElementById('product-json-ld');
    if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'product-json-ld';
        document.head.appendChild(script);
    }

    const variant = product && product.variants
        ? (product.variants[50] || product.variants['50'] || product.variants[30] || product.variants['30'] || product.variants[100] || product.variants['100'])
        : null;

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: title,
        description,
        image: [imageUrl],
        sku: String(product.id || ''),
        brand: {
            '@type': 'Brand',
            name: 'N\u00d8TE. fragrances'
        },
        url: canonicalUrl,
        offers: {
            '@type': 'Offer',
            url: canonicalUrl,
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/NewCondition'
        }
    };

    if (variant && typeof variant.price === 'number') {
        schema.offers.price = variant.price.toFixed(2);
    }

    const summary = product.reviewSummary || {};
    if (summary.count > 0 && summary.average > 0) {
        schema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: Number(summary.average).toFixed(1),
            reviewCount: Number(summary.count)
        };
    }

    script.textContent = JSON.stringify(schema);
}

function updateProductSeo(product) {
    if (!product || !product.id) return;

    const name = getProductSeoName(product);
    const title = `N\u00d8TE. ${name} Duftzwilling | Extrait de Parfum`;
    const description = getProductSeoDescription(product);
    const canonicalUrl = getProductCanonicalUrl(product);
    const imageUrl = getProductImageUrl(product);

    document.title = title;
    upsertMeta('meta[name="description"]', { name: 'description' }, description);
    upsertCanonical(canonicalUrl);
    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, 'product');
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, 'N\u00d8TE. fragrances');
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, title);
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, description);
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl);
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, imageUrl);
    upsertProductJsonLd(product, title, description, canonicalUrl, imageUrl);
}

function formatReviewDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function paintStars(container, rating) {
    if (!container) return;
    const normalized = Math.max(0, Math.min(5, Number(rating) || 0));
    const stars = container.querySelectorAll('.rating-star');
    stars.forEach((star, index) => {
        const position = index + 1;
        star.classList.remove('is-filled', 'is-half');
        if (normalized >= position) {
            star.classList.add('is-filled');
        } else if (normalized >= position - 0.5) {
            star.classList.add('is-half');
        }
    });
}

function setReviewInputStars(value) {
    currentReviewRating = value;
    const input = document.getElementById('review-rating-value');
    if (input) input.value = String(value);

    document.querySelectorAll('.review-star-btn').forEach((button) => {
        const rating = Number(button.dataset.rating || 0);
        button.classList.toggle('is-active', rating <= value);
        button.classList.remove('is-preview');
        button.setAttribute('aria-checked', rating === value ? 'true' : 'false');
    });
}

function previewReviewInputStars(value) {
    document.querySelectorAll('.review-star-btn').forEach((button) => {
        const rating = Number(button.dataset.rating || 0);
        button.classList.toggle('is-preview', rating <= value);
    });
}

async function fetchCurrentReviewUser() {
    try {
        const response = await fetch(API_BASE_URL + '/api/user', {
            credentials: 'include'
        });
        if (!response.ok) return null;
        const data = await response.json();
        if (data && data.user) return data.user;
        if (data && data.email) return data;
        return null;
    } catch (error) {
        return null;
    }
}

function setReviewFormMessage(message, type = '') {
    const messageEl = document.getElementById('review-form-message');
    if (!messageEl) return;
    messageEl.textContent = message || '';
    messageEl.classList.remove('is-error', 'is-success');
    if (type === 'error') messageEl.classList.add('is-error');
    if (type === 'success') messageEl.classList.add('is-success');
}

function closeReviewModal() {
    const modal = document.getElementById('review-modal');
    if (!modal) return;
    modal.setAttribute('hidden', '');
    document.body.classList.remove('no-scroll');
    document.documentElement.classList.remove('no-scroll');
}

async function openReviewModal() {
    const modal = document.getElementById('review-modal');
    if (!modal) return;
    modal.removeAttribute('hidden');
    document.body.classList.add('no-scroll');
    document.documentElement.classList.add('no-scroll');

    // Refresh auth state on every open (important after login redirect / mobile browser caching)
    const freshUser = await fetchCurrentReviewUser();
    if (freshUser) {
        currentReviewUser = freshUser;
        updateReviewFormState();
    }
}

function initReviewModal() {
    const modal = document.getElementById('review-modal');
    const trigger = document.getElementById('product-review-trigger');
    const closeBtn = document.getElementById('review-modal-close');
    const backdrop = document.getElementById('review-modal-backdrop');

    if (!modal || !trigger || trigger.dataset.bound === 'true') return;

    trigger.dataset.bound = 'true';
    trigger.addEventListener('click', openReviewModal);
    if (closeBtn) closeBtn.addEventListener('click', closeReviewModal);
    if (backdrop) backdrop.addEventListener('click', closeReviewModal);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.hasAttribute('hidden')) {
            closeReviewModal();
        }
    });
}

function updateReviewSummary(summary) {
    const average = summary && Number(summary.average) ? Number(summary.average) : 0;
    const count = summary && Number(summary.count) ? Number(summary.count) : 0;
    const averageScoreEl = document.getElementById('reviews-average-score');
    const summaryCountEl = document.getElementById('reviews-count-text');
    const topCountEl = document.getElementById('product-rating-count');

    if (averageScoreEl) averageScoreEl.textContent = average > 0 ? average.toFixed(1).replace('.', ',') : '0,0';
    if (summaryCountEl) {
        summaryCountEl.textContent = count > 0
            ? `${count} echte ${count === 1 ? 'Bewertung' : 'Bewertungen'}`
            : 'Noch keine Bewertungen';
    }
    if (topCountEl) {
        topCountEl.textContent = count > 0
            ? `${average.toFixed(1).replace('.', ',')}/5 (${count} ${count === 1 ? 'Bewertung' : 'Bewertungen'})`
            : 'Noch keine Bewertungen';
    }

    paintStars(document.getElementById('product-rating-stars'), average);
    paintStars(document.getElementById('reviews-average-stars'), average);
}

function renderReviewList(reviews) {
    const listEl = document.getElementById('reviews-list');
    const emptyEl = document.getElementById('reviews-empty-state');
    const subtitleEl = document.getElementById('reviews-list-subtitle');

    if (!listEl || !emptyEl || !subtitleEl) return;

    if (!reviews || !reviews.length) {
        listEl.innerHTML = '';
        emptyEl.style.display = 'block';
        subtitleEl.textContent = 'Sobald die ersten echten Bewertungen da sind, erscheinen sie hier.';
        return;
    }

    emptyEl.style.display = 'none';
    subtitleEl.textContent = `${reviews.length} veröffentlichte ${reviews.length === 1 ? 'Bewertung' : 'Bewertungen'} für dieses Produkt.`;
    listEl.innerHTML = reviews.map((review) => {
        const initials = escapeHtml(
            String(review.authorName || '')
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part.charAt(0).toUpperCase())
                .join('')
        );
        const stars = Array.from({ length: 5 }, (_, index) => `
            <span class="rating-star ${index < review.rating ? 'is-filled' : ''}" aria-hidden="true">&#9733;</span>
        `).join('');
        const title = review.title ? `<h4 class="review-item-title">${escapeHtml(review.title)}</h4>` : '';
        const verified = review.verifiedPurchase ? '<span class="review-verified-pill">Verifizierter Kauf</span>' : '';
        const own = review.isOwnReview ? '<span class="review-own-pill">Deine Bewertung</span>' : '';

        return `
            <article class="review-item">
                <div class="review-item-header">
                    <div class="review-item-identity">
                        <div class="review-item-avatar">${initials}</div>
                        <div class="review-item-author-block">
                            <div class="review-item-author-row">
                                <div class="review-item-author">${escapeHtml(review.authorName)}</div>
                                <span class="review-item-date">${formatReviewDate(review.updatedAt || review.createdAt)}</span>
                            </div>
                            <div class="review-item-meta">
                                ${verified}
                                ${own}
                            </div>
                        </div>
                    </div>
                    <div class="review-item-rating">
                        <div class="rating-stars" aria-label="${review.rating} von 5 Sternen">${stars}</div>
                    </div>
                </div>
                ${title}
                <p class="review-item-comment">${escapeHtml(review.comment)}</p>
            </article>
        `;
    }).join('');
}

function fillReviewFormFromOwnReview(review) {
    const titleInput = document.getElementById('review-title');
    const commentInput = document.getElementById('review-comment');
    if (titleInput) titleInput.value = review ? (review.title || '') : '';
    if (commentInput) commentInput.value = review ? (review.comment || '') : '';
    setReviewInputStars(review ? Number(review.rating || 0) : 0);
}

function updateReviewFormState() {
    const helperEl = document.getElementById('review-form-helper');
    const form = document.getElementById('review-form');
    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
    const disabled = !currentReviewUser;

    if (helperEl) {
        helperEl.textContent = currentReviewUser
            ? 'Du kannst deine Bewertung jederzeit aktualisieren.'
            : 'Bitte logge dich ein, um eine Bewertung abzugeben. Mit dem Button unten kommst du direkt zum Konto.';
    }

    if (!form) return;

    form.querySelectorAll('input, textarea, button').forEach((element) => {
        if (element.type === 'hidden') return;
        if (element.type === 'submit') return;
        element.disabled = disabled;
    });

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = currentReviewUser ? 'Bewertung speichern' : 'Zum Login';
    }
}

async function loadProductReviews(productId) {
    currentReviewProductId = productId;

    try {
        const [user, reviewResponse] = await Promise.all([
            fetchCurrentReviewUser(),
            fetch(API_BASE_URL + `/api/products/${encodeURIComponent(productId)}/reviews`, {
                credentials: 'include'
            })
        ]);

        currentReviewUser = user;

        const payload = reviewResponse.ok ? await reviewResponse.json() : { summary: { average: 0, count: 0 }, reviews: [] };
        updateReviewSummary(payload.summary || {});
        renderReviewList(payload.reviews || []);

        const ownReview = (payload.reviews || []).find((review) => review.isOwnReview);
        fillReviewFormFromOwnReview(ownReview || null);
        updateReviewFormState();
    } catch (error) {
        console.error('Bewertungen konnten nicht geladen werden:', error);
        updateReviewSummary({ average: 0, count: 0 });
        renderReviewList([]);
        currentReviewUser = null;
        fillReviewFormFromOwnReview(null);
        updateReviewFormState();
    }
}

function initReviewForm() {
    const form = document.getElementById('review-form');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    document.querySelectorAll('.review-star-btn').forEach((button) => {
        button.addEventListener('mouseenter', () => {
            previewReviewInputStars(Number(button.dataset.rating || 0));
        });
        button.addEventListener('focus', () => {
            previewReviewInputStars(Number(button.dataset.rating || 0));
        });
        button.addEventListener('click', () => {
            setReviewInputStars(Number(button.dataset.rating || 0));
        });
    });

    const starInput = document.getElementById('review-star-input');
    if (starInput) {
        starInput.addEventListener('mouseleave', () => {
            previewReviewInputStars(0);
        });
        starInput.addEventListener('focusout', () => {
            window.setTimeout(() => {
                if (!starInput.contains(document.activeElement)) {
                    previewReviewInputStars(0);
                }
            }, 0);
        });
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!currentReviewProductId) return;
        if (!currentReviewUser) {
            const freshUser = await fetchCurrentReviewUser();
            if (freshUser) {
                currentReviewUser = freshUser;
                updateReviewFormState();
            }
        }
        if (!currentReviewUser) {
            const returnTo = encodeURIComponent(window.location.pathname.split('/').pop() + window.location.search);
            window.location.href = `account.html?returnTo=${returnTo}`;
            return;
        }

        if (currentReviewRating < 1 || currentReviewRating > 5) {
            setReviewFormMessage('Bitte wähle zuerst deine Sternebewertung aus.', 'error');
            return;
        }

        const title = document.getElementById('review-title');
        const comment = document.getElementById('review-comment');
        const submitButton = form.querySelector('button[type="submit"]');
        const payload = {
            rating: currentReviewRating,
            title: title ? title.value.trim() : '',
            comment: comment ? comment.value.trim() : ''
        };

        submitButton.disabled = true;
        setReviewFormMessage('Bewertung wird gespeichert...');

        try {
            const response = await fetch(API_BASE_URL + `/api/products/${encodeURIComponent(currentReviewProductId)}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Bewertung konnte nicht gespeichert werden.');
            }

            setReviewFormMessage(data.message || 'Bewertung gespeichert.', 'success');
            updateReviewSummary(data.summary || {});
            renderReviewList(data.reviews || []);
            const ownReview = (data.reviews || []).find((review) => review.isOwnReview);
            fillReviewFormFromOwnReview(ownReview || null);
            updateReviewFormState();
            closeReviewModal();
        } catch (error) {
            setReviewFormMessage(error.message || 'Bewertung konnte nicht gespeichert werden.', 'error');
        } finally {
            submitButton.disabled = false;
        }
    });
}

// Detailansicht rendern (für product.html)
function renderProductDetail(id) {
    const product = products.find(p => p.id === id);
    if (!product) {
        document.querySelector('.detail-container').innerHTML = '<p>Produkt nicht gefunden.</p>';
        return;
    }

    try {
        updateProductSeo(product);
    } catch (error) {
        console.error('Product SEO update failed:', error);
    }

    document.getElementById('detail-title').innerText = 'NØTE. ' + product.name.replace(/\s*\(\d+ml\)/, '').replace(/^No\.\s*/i, '');
    const detailBestsellerFlag = document.getElementById('detail-bestseller-flag');
    if (detailBestsellerFlag) {
        if (isBestseller(product)) {
            detailBestsellerFlag.textContent = 'Bestseller';
            detailBestsellerFlag.style.display = 'inline-block';
        } else {
            detailBestsellerFlag.textContent = '';
            detailBestsellerFlag.style.display = 'none';
        }
    }

    initReviewForm();
    initReviewModal();
    setReviewFormMessage('');
    loadProductReviews(product.id);

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

    // Strip any "Inspiriert von ..." or "Inspired by ..." sentences before displaying
    function removeBrandSentences(text) {
        if (!text) return '';
        return text
            .replace(/Inspiriert\s+von\s+[^.]+\./gi, '')
            .replace(/Inspired\s+by\s+[^.]+\./gi, '')
            .replace(/^\s*[\r\n]+/, '')
            .trim();
    }
    document.getElementById('detail-desc').innerText = removeBrandSentences(product.description);
    document.getElementById('detail-long-desc').innerText = removeBrandSentences(product.longDescription);

    // Duftnoten
    const notesList = document.getElementById('detail-notes');
    if (notesList && product.notes) {
        notesList.innerHTML = `
            <li><strong>Kopfnote:</strong> ${escapeHtml(product.notes.head || '')}</li>
            <li><strong>Herznote:</strong> ${escapeHtml(product.notes.heart || '')}</li>
            <li><strong>Basisnote:</strong> ${escapeHtml(product.notes.base || '')}</li>
        `;
    }

    // "Inspired by" – zeige "...Duftname®" (Markenname wird entfernt via stripBrandName)
    const inspiredByContainer = document.querySelector('.inspired-by');
    if (inspiredByContainer) {
        if (product.inspiredBy) {
            const cleanName = stripBrandName(product.inspiredBy);
            inspiredByContainer.innerHTML = `<span class="inspired-by-text">...${escapeHtml(cleanName)}&reg;</span>`;
            inspiredByContainer.style.display = '';
        } else {
            inspiredByContainer.style.display = 'none';
        }
    }

    // Hauptbild
    const galleryImages = getProductGalleryImages(product);
    const mainImg = document.getElementById('detail-main-image');
    const mainImgSrc = safeImageSrc(galleryImages[0]);
    mainImg.src = mainImgSrc;

    // Thumbnails
    const thumbContainer = document.getElementById('detail-thumbnails');
    if (galleryImages.length > 1) {
        thumbContainer.innerHTML = galleryImages.map((img, index) => `
            <img src="${safeImageSrc(img)}" alt="${escapeHtml(product.name || 'Produkt')} Ansicht ${index + 1}" class="detail-thumbnail ${index === 0 ? 'active' : ''}"
                 onclick="changeDetailImage(decodeURIComponent('${encodeURIComponent(String(img || ''))}'), this)" 
                 onerror="this.style.display='none'">
        `).join('');
    } else {
        thumbContainer.innerHTML = '';
    }
    initProductGallerySwipe();

    // Größenauswahl (Buttons in existierende Gruppe rendern)
    const optionGroup = document.querySelector('.option-group');
    if (optionGroup) {
        const sizes = [30, 50];
        optionGroup.innerHTML = sizes.map(size => `
            <button class="option-btn ${size === currentSelectedSize ? 'active' : ''} relative" 
                    onclick="changeSize(decodeURIComponent('${sanitizeProductUrlId(product.id)}'), ${size})">
                ${size}ml
                ${(size === 50 && isBestseller(product)) ? '<span class="badge">Bestseller</span>' : ''}
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

    // Load recommendations
    const recommendedGrid = document.getElementById('recommended-products-grid');
    if (recommendedGrid) {
        let similar = products.filter(p => p.id !== product.id && p.category === product.category);
        if (similar.length < 4) similar = products.filter(p => p.id !== product.id);
        similar.sort(() => 0.5 - Math.random());
        const bestFour = similar.slice(0, 4);
        recommendedGrid.innerHTML = bestFour.map(p => getProductCardHTML(p)).join('');
    }
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
    document.getElementById('detail-main-image').src = safeImageSrc(src);
    document.querySelectorAll('.detail-thumbnail').forEach(t => t.classList.remove('active'));
    if (thumbnail) thumbnail.classList.add('active');
}

function initProductGallerySwipe() {
    const wrapper = document.querySelector('.detail-main-image-wrapper');
    const mainImage = document.getElementById('detail-main-image');
    if (!wrapper || !mainImage || wrapper.dataset.swipeReady === 'true') return;

    wrapper.dataset.swipeReady = 'true';
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', 'Produktbilder. Nach links oder rechts wischen, um das Bild zu wechseln.');

    const settleDuration = 300;
    const settleEasing = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let lastMoveAt = 0;
    let swipeVelocity = 0;
    let activePointerId = null;
    let isTracking = false;
    let isHorizontal = false;
    let direction = 0;
    let previewImage = null;
    let nextThumbnail = null;
    let settleTimer = 0;

    const getVisibleThumbnails = () => Array.from(document.querySelectorAll('.detail-thumbnail'))
        .filter((thumbnail) => thumbnail.style.display !== 'none');

    function removePreview() {
        if (previewImage) previewImage.remove();
        previewImage = null;
        nextThumbnail = null;
        direction = 0;
    }

    function resetGalleryPosition() {
        window.clearTimeout(settleTimer);
        mainImage.style.transition = '';
        mainImage.style.transform = '';
        wrapper.classList.remove('is-gallery-dragging', 'is-gallery-settling');
        removePreview();
    }

    function preparePreview(deltaX) {
        const thumbnails = getVisibleThumbnails();
        if (thumbnails.length < 2) return false;

        const activeIndex = Math.max(0, thumbnails.findIndex((thumbnail) => thumbnail.classList.contains('active')));
        const requestedDirection = deltaX < 0 ? 1 : -1;
        const nextIndex = activeIndex + requestedDirection;

        if (nextIndex < 0 || nextIndex >= thumbnails.length) {
            removePreview();
            direction = requestedDirection;
            return false;
        }

        const requestedThumbnail = thumbnails[nextIndex];
        if (previewImage && requestedThumbnail === nextThumbnail) return true;

        removePreview();
        direction = requestedDirection;
        nextThumbnail = requestedThumbnail;
        previewImage = document.createElement('img');
        previewImage.className = 'detail-gallery-swipe-image';
        previewImage.src = requestedThumbnail.currentSrc || requestedThumbnail.getAttribute('src');
        previewImage.alt = '';
        previewImage.setAttribute('aria-hidden', 'true');
        previewImage.draggable = false;
        wrapper.insertBefore(previewImage, mainImage);
        return true;
    }

    function moveGallery(deltaX) {
        const hasNextImage = preparePreview(deltaX);
        const displayedDelta = hasNextImage ? deltaX : deltaX * 0.22;

        mainImage.style.transform = `translate3d(${displayedDelta}px, 0, 0)`;
        if (previewImage) {
            previewImage.style.transform = `translate3d(calc(${direction * 100}% + ${deltaX}px), 0, 0)`;
        }
    }

    function settleGallery(commit) {
        const frameWidth = Math.max(1, wrapper.getBoundingClientRect().width);
        wrapper.classList.remove('is-gallery-dragging');
        wrapper.classList.add('is-gallery-settling');
        mainImage.style.transition = `transform ${settleDuration}ms ${settleEasing}`;

        if (previewImage) {
            previewImage.style.transition = `transform ${settleDuration}ms ${settleEasing}`;
        }

        requestAnimationFrame(() => {
            if (commit && previewImage && nextThumbnail) {
                mainImage.style.transform = `translate3d(${-direction * frameWidth}px, 0, 0)`;
                previewImage.style.transform = 'translate3d(0, 0, 0)';
            } else {
                mainImage.style.transform = 'translate3d(0, 0, 0)';
                if (previewImage) {
                    previewImage.style.transform = `translate3d(${direction * 100}%, 0, 0)`;
                }
            }
        });

        const selectedThumbnail = nextThumbnail;
        settleTimer = window.setTimeout(() => {
            if (commit && selectedThumbnail) {
                changeDetailImage(selectedThumbnail.getAttribute('src'), selectedThumbnail);
            }
            resetGalleryPosition();
        }, settleDuration + 30);
    }

    wrapper.addEventListener('pointerdown', (event) => {
        if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
        if (event.pointerType === 'mouse' && !window.matchMedia('(max-width: 900px)').matches) return;
        if (wrapper.classList.contains('is-gallery-settling')) return;

        startX = event.clientX;
        startY = event.clientY;
        currentX = startX;
        lastMoveAt = performance.now();
        swipeVelocity = 0;
        activePointerId = event.pointerId;
        isTracking = true;
        isHorizontal = false;
        mainImage.style.transition = 'none';
        wrapper.classList.add('is-gallery-dragging');
        wrapper.setPointerCapture?.(event.pointerId);
    });

    wrapper.addEventListener('pointermove', (event) => {
        if (!isTracking || event.pointerId !== activePointerId) return;
        const now = performance.now();
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        swipeVelocity = Math.abs(event.clientX - currentX) / Math.max(1, now - lastMoveAt);
        currentX = event.clientX;
        lastMoveAt = now;

        if (!isHorizontal) {
            if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 7) return;
            if (Math.abs(deltaY) >= Math.abs(deltaX)) {
                isTracking = false;
                wrapper.classList.remove('is-gallery-dragging');
                mainImage.style.transition = '';
                if (wrapper.hasPointerCapture?.(event.pointerId)) wrapper.releasePointerCapture(event.pointerId);
                activePointerId = null;
                return;
            }
            isHorizontal = true;
        }

        event.preventDefault();
        moveGallery(deltaX);
    });

    wrapper.addEventListener('pointerup', (event) => {
        if (!isTracking || event.pointerId !== activePointerId) return;
        const deltaX = event.clientX - startX;
        const threshold = Math.min(72, wrapper.getBoundingClientRect().width * 0.18);
        const commit = isHorizontal && Boolean(previewImage) &&
            (Math.abs(deltaX) >= threshold || (Math.abs(deltaX) >= 24 && swipeVelocity >= 0.35));

        isTracking = false;
        if (wrapper.hasPointerCapture?.(event.pointerId)) wrapper.releasePointerCapture(event.pointerId);
        activePointerId = null;
        if (isHorizontal) {
            settleGallery(commit);
        } else {
            resetGalleryPosition();
        }
    });

    wrapper.addEventListener('pointercancel', (event) => {
        if (!isTracking || event.pointerId !== activePointerId) return;
        isTracking = false;
        activePointerId = null;
        settleGallery(false);
    });
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
        const cartImage = (product.images && product.images.length > 0) ? product.images[0] : 'logo.webp';

        cart.push({
            cartId: cartItemId,
            id: product.id + (variant.idSuffix || `-${size}`),
            productId: product.id,
            name: `${product.name} (${size}ml)`,
            price: variant.price,
            originalPrice: variant.originalPrice || null,
            size: size,
            quantity: 1,
            image: cartImage
        });
    }

    updateCartUI();

    // Das neue Header-System hat Vorrang. Den alten Sidebar nur noch als
    // Rückfall für Seiten ohne den gemeinsamen Drawer öffnen.
    if (document.querySelector('[data-cart-drawer]')) {
        window.dispatchEvent(new CustomEvent('note:open-cart'));
    } else if (cartSidebar && !cartSidebar.classList.contains('open')) {
        toggleCart();
    }
}

// Aus dem Warenkorb entfernen
function removeFromCart(cartItemId) {
    cart = cart.filter(item => item.cartId !== cartItemId);
    updateCartUI();
}

function resolveCartProductId(item) {
    if (item && item.productId) return String(item.productId);

    if (item && item.id) {
        const fromId = String(item.id).replace(/-\d+$/, '');
        if (fromId) return fromId;
    }

    if (item && item.cartId) {
        const cartId = String(item.cartId);
        const idx = cartId.lastIndexOf('-');
        if (idx > 0) return cartId.slice(0, idx);
    }

    return '';
}

function openCartItemProduct(productId) {
    const id = String(productId || '').trim();
    if (!id) return;
    window.location.href = `product.html?id=${encodeURIComponent(id)}`;
}

// Warenkorb UI aktualisieren
function updateCartUI() {
    // 1. Counter Update
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountElement) cartCountElement.innerText = totalItems;

    // Header Count Update
    const headerCount = document.getElementById('cart-count-header');
    if (headerCount) headerCount.innerText = totalItems;

    // Save state
    localStorage.setItem('cart', JSON.stringify(cart));
    persistCouponState();

    // Neues Header-System (style-wave-home.js) ueber Aenderung informieren,
    // damit der neue Cart-Drawer + .cart-count neu gerendert werden.
    // (storage-Event feuert nur in anderen Tabs, daher eigenes Event.)
    window.dispatchEvent(new CustomEvent('note:cart-changed'));

    // 2. Items rendern
    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-msg" style="padding: 1.5rem; text-align: center; color: #666;">Ihr Warenkorb ist leer.</p>';
    } else {
        cartItemsContainer.innerHTML = cart.map(item => {
            const totalPrice = item.price * item.quantity;
            const safeCartItemId = encodeURIComponent(String(item.cartId || ''));
            const safeItemImage = safeImageSrc(item.image || 'logo.webp');
            const safeItemAlt = escapeHtml(item.name || '');
            const productTargetId = resolveCartProductId(item);
            const safeProductTargetId = encodeURIComponent(productTargetId);

            // Look up originalPrice from products array (covers items added before this feature)
            const product = products.find(p => p.id === item.productId);
            const variantData = product && product.variants && product.variants[item.size];
            const origPrice = item.originalPrice || (variantData && variantData.originalPrice) || null;

            const hasOriginal = origPrice && origPrice > item.price;
            const totalOriginal = hasOriginal ? origPrice * item.quantity : null;
            const savings = hasOriginal ? totalOriginal - totalPrice : 0;

            const priceHTML = hasOriginal
                ? `<div class="item-price-original">${totalOriginal.toFixed(2)} €</div>
                   <div class="item-price">${totalPrice.toFixed(2)} €</div>
                   <div class="item-savings">(${savings.toFixed(2)} € gespart)</div>`
                : `<div class="item-price">${totalPrice.toFixed(2)} €</div>`;

            const cleanName = escapeHtml(String(item.name || '').replace(/\s*\(\d+ml\)/, '').replace(/^No\.\s*/i, ''));
            const inspiredText = product && product.inspiredBy
                ? `<br><span style="font-family: 'Playfair Display', serif; font-size: 1.3em; color: #1a1a1a; font-weight: normal; font-style: normal;">...${escapeHtml(stripBrandName(product.inspiredBy))}&reg;</span>`
                : '';

            return `
            <div class="cart-item">
                <button class="cart-item-image-link" onclick="openCartItemProduct(decodeURIComponent('${safeProductTargetId}'))" aria-label="Produkt anzeigen">
                    <img src="${safeItemImage}" alt="${safeItemAlt}" onerror="this.src='logo.webp'">
                </button>
                <div class="cart-item-info">
                    <div class="cart-item-title" style="line-height: 1.3;">${cleanName}${inspiredText}</div>
                    <div class="cart-item-variant">${item.size}ml</div>
                    <div class="quantity-control">
                        <button class="qty-btn" onclick="changeQuantity(decodeURIComponent('${safeCartItemId}'), -1)">−</button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="qty-btn" onclick="changeQuantity(decodeURIComponent('${safeCartItemId}'), 1)">+</button>
                    </div>
                </div>
                <div class="cart-item-right">
                    <button class="delete-btn" onclick="removeFromCart(decodeURIComponent('${safeCartItemId}'))">
                        <i class="far fa-trash-alt"></i>
                    </button>
                    <div class="cart-item-price-block">
                        ${priceHTML}
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    // 3. Berechnungen (Subtotal, Discount, Shipping, Total)
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = subtotal * currentDiscount;
    const shippingThreshold = 60.00;
    let shippingCost = 0;

    // Kostenloser Versand Logik
    const remainingForFreeShipping = shippingThreshold - subtotal;
    const hasCouponFreeShipping = currentCouponFreeShipping === true;
    const shippingMessage = document.getElementById('shipping-message');
    const shippingBar = document.getElementById('shipping-progress-bar');

    if (currentDeliveryMethod === 'shipping') {
        if (shippingMessage && shippingBar) {
            if (hasCouponFreeShipping) {
                shippingMessage.innerHTML = '<strong>Kostenloser Versand durch Gutschein!</strong>';
                shippingBar.style.width = '100%';
                shippingCost = 0;
            } else if (remainingForFreeShipping <= 0) {
                shippingMessage.innerHTML = '<strong>Kostenloser Versand!</strong>';
                shippingBar.style.width = '100%';
                shippingCost = 0;
            } else {
                shippingMessage.innerText = `Noch ${remainingForFreeShipping.toFixed(2)} € bis zu kostenlosem Versand`;
                const percentage = Math.min(100, (subtotal / shippingThreshold) * 100);
                shippingBar.style.width = `${percentage}%`;
                shippingCost = 6.99; // Standard shipping cost
            }
        }
    } else {
        // Pickup
        shippingCost = 0;
    }

    const total = subtotal - discountAmount + shippingCost;

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
        if (currentDeliveryMethod === 'pickup') {
            shippingEl.innerText = 'Abholung (0,00 €)';
        } else {
            shippingEl.innerText = remainingForFreeShipping <= 0 ? 'Kostenlos' : shippingCost.toFixed(2) + ' €';
        }
    }

    if (totalEl) totalEl.innerText = total.toFixed(2) + ' €';

    if (shippingEl && currentDeliveryMethod !== 'pickup' && hasCouponFreeShipping) {
        shippingEl.innerText = 'Kostenlos';
    }

    // 5. Sync Coupon UI State
    const input = document.getElementById('coupon-code');
    const message = document.getElementById('coupon-message');
    const btn = document.querySelector('.coupon-input-group button');

    if (input && message && btn && currentDiscount > 0 && currentCouponCode) {
        input.value = currentCouponCode;
        input.disabled = true;
        btn.disabled = true;
        btn.innerText = '✓';
        message.textContent = `Gutschein aktiviert (${currentCouponLabel || `${Math.round(currentDiscount * 100)}% Rabatt`})`;
        message.className = 'coupon-message success';
    } else if (input && message && btn) {
        input.disabled = false;
        btn.disabled = false;
        btn.innerText = 'OK';
    }

    // 6. Update Upsell
    updateUpsell();
}

window.addEventListener('note:cart-updated-by-drawer', () => {
    try {
        const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');
        cart = Array.isArray(storedCart) ? storedCart : [];
        updateCartUI();
    } catch (error) {
        cart = [];
        updateCartUI();
    }
});

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

// Upsell Logik – zeigt ein Produkt passend zur Warenkorb-Kategorie
function updateUpsell() {
    const container = document.getElementById('upsell-container');
    if (!container) return;

    // Finde Produktids die bereits im Warenkorb sind
    const cartProductIds = new Set(cart.map(c => c.productId));

    // Bestimme welche Kategorie überwiegt im Warenkorb
    const categoryCounts = {};
    cart.forEach(c => {
        const p = products.find(x => x.id === c.productId);
        if (p && p.category) {
            categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
        }
    });
    const dominantCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    // Filtere: nicht im Warenkorb, bevorzuge gleiche Kategorie
    let pool = products.filter(p => !cartProductIds.has(p.id) && p.variants?.[50]?.price);

    // Zuerst gleiche Kategorie, dann Bestseller bevorzugen
    let sameCat = dominantCategory ? pool.filter(p => p.category === dominantCategory) : pool;
    if (sameCat.length === 0) sameCat = pool;

    // Bestseller zuerst, dann zufällig aus dem Rest
    const bestsellers = sameCat.filter(p => p.bestseller);
    const others = sameCat.filter(p => !p.bestseller);
    const sortedPool = [...bestsellers, ...others];

    if (sortedPool.length === 0) {
        container.innerHTML = '<p style="font-size:0.8rem;color:#999;text-align:center;">Alle Düfte im Warenkorb!</p>';
        return;
    }

    // Zufällig aus den Top-10 des sortierten Pools wählen (für Abwechslung)
    const pick = sortedPool[Math.floor(Math.random() * Math.min(10, sortedPool.length))];
    const price = pick.variants[30]?.price ?? pick.variants[50]?.price;

    container.innerHTML = `
        <div class="upsell-card">
            <img src="${(pick.images && pick.images.length > 0) ? pick.images[0] : 'logo.webp'}"
                 class="upsell-img"
                 alt="${pick.name}"
                 onerror="this.src='logo.webp'">
            <div class="upsell-info">
                <div class="upsell-title">${pick.name}${pick.bestseller ? ' <span class="upsell-bs-badge">Bestseller</span>' : ''}</div>
                <div class="upsell-price">ab ${price.toFixed(2)} €</div>
            </div>
            <button class="upsell-add-btn" onclick="window.location.href='product.html?id=${pick.id}'">Ansehen</button>
        </div>
    `;
}

// Timer Logik – persistiert via localStorage seitenübergreifend
let timerInterval;
const TIMER_KEY = 'cartTimerEnd';
const TIMER_DURATION_MS = 10 * 60 * 1000; // 10 Minuten

function startCartTimer() {
    const timerEl = document.getElementById('cart-timer');
    if (!timerEl) return;

    // Alte sessionStorage-Version bereinigen (Migration von alter Implementierung)
    sessionStorage.removeItem(TIMER_KEY);

    // Ablaufzeit aus localStorage lesen oder neu starten
    let endTime = parseInt(localStorage.getItem(TIMER_KEY), 10);
    if (!endTime || endTime <= Date.now()) {
        // Kein gültiger Timer vorhanden → neu starten
        endTime = Date.now() + TIMER_DURATION_MS;
        localStorage.setItem(TIMER_KEY, endTime);
    }

    // Sofort die richtige Zeit anzeigen (kein "10:00" Flash)
    const initRemaining = Math.max(0, endTime - Date.now());
    const initMin = Math.floor(initRemaining / 60000);
    const initSec = Math.floor((initRemaining % 60000) / 1000);
    timerEl.innerText = `${initMin.toString().padStart(2, '0')}:${initSec.toString().padStart(2, '0')}`;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const remaining = Math.max(0, endTime - Date.now());
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        timerEl.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (remaining <= 0) {
            clearInterval(timerInterval);
            timerEl.innerText = '00:00';
            localStorage.removeItem(TIMER_KEY);
        }
    }, 500);
}

// Start Timer beim Laden
startCartTimer();


// Gutschein anwenden
async function applyCoupon() {
    const input = document.getElementById('coupon-code');
    const message = document.getElementById('coupon-message');
    const btn = document.querySelector('.coupon-input-group button');

    if (!input || !message) return;

    const code = input.value.trim();
    if (!code) return;

    btn.disabled = true;
    btn.innerText = '…';

    try {
        const res = await fetch(API_BASE_URL + '/api/validate-coupon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        const data = await res.json();

        if (data.valid) {
            currentDiscount = data.discount / 100;
            currentCouponCode = data.code || code.toUpperCase();
            currentCouponLabel = data.label || `${data.discount}% Rabatt`;
            currentCouponFreeShipping = data.freeShipping === true;
            message.textContent = `Gutschein erfolgreich aktiviert (${currentCouponLabel})`;
            message.className = 'coupon-message success';
            input.disabled = true;
            btn.disabled = true;
            btn.innerText = '✓';
        } else {
            clearCouponState();
            message.textContent = 'Der Gutscheincode ist ungültig.';
            message.className = 'coupon-message error';
            btn.disabled = false;
            btn.innerText = 'OK';
        }
    } catch (e) {
        clearCouponState();
        message.textContent = 'Fehler bei der Überprüfung. Bitte erneut versuchen.';
        message.className = 'coupon-message error';
        btn.disabled = false;
        btn.innerText = 'OK';
    }

    updateCartUI();
}

// Warenkorb Toggle (Öffnen/Schließen)
function toggleCart() {
    if (!cartSidebar) return;
    const cartOverlay = overlay || document.getElementById('overlay');

    cartSidebar.classList.remove('is-dragging');
    cartSidebar.style.transform = '';

    if (cartSidebar.classList.contains('open')) {
        cartSidebar.classList.remove('open');
        if (cartOverlay) cartOverlay.classList.remove('open');
        document.body.classList.remove('no-scroll');
        document.body.classList.remove('no-scroll-fixed');
        document.documentElement.classList.remove('no-scroll');
        document.body.style.top = '';
        window.scrollTo(0, cartScrollLockY);
    } else {
        cartScrollLockY = window.scrollY || window.pageYOffset || 0;
        cartSidebar.classList.add('open');
        if (cartOverlay) cartOverlay.classList.add('open');
        document.body.classList.add('no-scroll');
        document.body.classList.add('no-scroll-fixed');
        document.documentElement.classList.add('no-scroll');
        document.body.style.top = `-${cartScrollLockY}px`;
    }
}

function setupCartSwipeToClose() {
    if (!cartSidebar || cartSidebar.dataset.swipeInit === '1') return;
    cartSidebar.dataset.swipeInit = '1';

    let startX = 0;
    let startY = 0;
    let deltaX = 0;
    let tracking = false;
    let horizontalGesture = false;

    function clearDragState() {
        tracking = false;
        horizontalGesture = false;
        deltaX = 0;
        cartSidebar.classList.remove('is-dragging');
        cartSidebar.style.transform = '';
    }

    cartSidebar.addEventListener('touchstart', (event) => {
        if (!cartSidebar.classList.contains('open')) return;
        if (!event.touches || event.touches.length !== 1) return;
        const touch = event.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        deltaX = 0;
        tracking = true;
        horizontalGesture = false;
        cartSidebar.classList.add('is-dragging');
    }, { passive: true });

    cartSidebar.addEventListener('touchmove', (event) => {
        if (!tracking || !event.touches || event.touches.length !== 1) return;
        const touch = event.touches[0];
        const moveX = touch.clientX - startX;
        const moveY = touch.clientY - startY;

        if (!horizontalGesture) {
            if (Math.abs(moveX) < 8 && Math.abs(moveY) < 8) return;
            if (Math.abs(moveY) > Math.abs(moveX)) {
                clearDragState();
                return;
            }
            horizontalGesture = true;
        }

        if (moveX <= 0) {
            deltaX = 0;
            cartSidebar.style.transform = 'translate3d(0,0,0)';
            return;
        }

        event.preventDefault();
        deltaX = Math.min(moveX, cartSidebar.clientWidth || 380);
        cartSidebar.style.transform = `translate3d(${Math.round(deltaX)}px,0,0)`;
    }, { passive: false });

    cartSidebar.addEventListener('touchend', () => {
        if (!tracking) return;
        const closeThreshold = Math.max(72, Math.round((cartSidebar.clientWidth || 380) * 0.24));
        const shouldClose = deltaX >= closeThreshold;
        clearDragState();
        if (shouldClose && cartSidebar.classList.contains('open')) {
            toggleCart();
        }
    }, { passive: true });

    cartSidebar.addEventListener('touchcancel', clearDragState, { passive: true });
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('mobile-active');
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    const navLinks = document.querySelector('.nav-links');
    const hamburgerMenu = document.querySelector('.hamburger-menu');

    // If menu is open and click was outside both the menu and the hamburger button
    if (navLinks && navLinks.classList.contains('mobile-active')) {
        if (!navLinks.contains(e.target) && hamburgerMenu && !hamburgerMenu.contains(e.target)) {
            navLinks.classList.remove('mobile-active');
        }
    }
});

// Close mobile menu when clicking a link inside it
// Using event delegation for reliability on all mobile browsers / iOS
const _navLinksContainer = document.querySelector('.nav-links');
if (_navLinksContainer) {
    const _closeMobileMenu = (e) => {
        // Check if the tap/click landed on or inside an <a> tag
        const link = e.target.closest('a');
        if (link && _navLinksContainer.classList.contains('mobile-active')) {
            _navLinksContainer.classList.remove('mobile-active');
        }
    };
    _navLinksContainer.addEventListener('click', _closeMobileMenu);
    // Also handle touchend for faster response on iOS
    _navLinksContainer.addEventListener('touchend', _closeMobileMenu, { passive: true });
}

// Suche

// Checkout (Dummy)
async function checkout() {
    // 1. Prüfe, ob der Warenkorb leer ist
    if (cart.length === 0) {
        alert("Ihr Warenkorb ist leer.");
        return;
    }

    if (currentDeliveryMethod === 'pickup') {
        const name = document.getElementById('pickup-name').value.trim();
        const email = document.getElementById('pickup-email').value.trim();
        if (!name || !email) {
            alert("Bitte gib deinen Namen und deine E-Mail-Adresse für die Reservierung ein.");
            return;
        }

        const pickupCartItems = cart.map(item => ({
            id: item.id,
            quantity: item.quantity,
            size: item.size
        }));

        // Pickup-Flag in sessionStorage speichern, damit success.html es auch ohne URL-Param lesen kann
        sessionStorage.setItem('isPickupOrder', 'true');

        try {
            const response = await fetch(API_BASE_URL + '/create-pickup-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: pickupCartItems,
                    customerName: name,
                    customerEmail: email,
                    couponCode: currentCouponCode || undefined
                })
            });
            if (response.ok) {
                cart = [];
                updateCartUI();
                toggleCart();
                const pickupSuccessUrlOk = 'success.html?pickup=true';
                window.location.href = pickupSuccessUrlOk;
            } else {
                // Backend-Fehler – trotzdem als Pickup-Bestellung auf Success-Seite
                const errorData = await response.json().catch(() => ({}));
                if (errorData.error && errorData.error.includes('Gutscheincode')) {
                    clearCouponState();
                    updateCartUI();
                }
                alert(errorData.error || 'Die Abhol-Bestellung konnte nicht erstellt werden.');
            }
        } catch (e) {
            console.error(e);
            alert('Die Abhol-Bestellung konnte nicht gestartet werden. Bitte versuche es erneut.');
        }
        return;
    }

    let customerEmail = null;

    // Versuche, die E-Mail des eingeloggten Users zu holen
    try {
        const userRes = await fetch(API_BASE_URL + '/api/user', { credentials: 'include' });
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
    if (currentCouponCode) {
        body.couponCode = currentCouponCode;
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
                if (err.error && err.error.includes('Gutscheincode')) {
                    clearCouponState();
                    updateCartUI();
                }
                throw new Error(err.error || 'Netzwerk-Antwort war nicht ok');
            }

        const data = await response.json();

        if (data.safeMode) {
            const total = typeof data.totalCents === 'number'
                ? (data.totalCents / 100).toFixed(2).replace('.', ',')
                : '0,00';
            const discount = typeof data.discountAmountCents === 'number'
                ? (data.discountAmountCents / 100).toFixed(2).replace('.', ',')
                : '0,00';
            alert(`Safe-Mode Checkout-Test\nGesamt: ${total} €\nRabatt: ${discount} €\nEs wurde keine echte Stripe-Session erstellt.`);
            return;
        }

        // 3. Weiterleitung zu Stripe
        if (data.url) {
            sessionStorage.setItem(STRIPE_PENDING_CHECKOUT_KEY, '1');
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
    if (!searchOverlay) return;

    searchOverlay.classList.toggle('open');
    if (searchOverlay.classList.contains('open')) {
        setTimeout(() => {
            const input = document.getElementById('search-input');
            if (input) {
                input.focus();
                // Enter key → go to search results page
                input.onkeydown = function (e) {
                    if (e.key === 'Enter') {
                        const q = input.value.trim();
                        if (q.length >= 1) {
                            window.location.href = `suche?q=${encodeURIComponent(q)}`;
                        }
                    }
                };
            }
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

async function performSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    const queryRaw = searchInput.value;
    const query = queryRaw.toLowerCase();
    const resultsContainer = document.getElementById('search-results');

    if (!resultsContainer) return;

    if (query.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }

    if (!products.length) {
        resultsContainer.innerHTML = '<p class="no-results" style="grid-column: 1/-1; text-align: center; color: #666; padding: 1rem;">Lade Düfte…</p>';
        try {
            await ensureProductsLoaded();
        } catch (error) {
            resultsContainer.innerHTML = '<p class="no-results" style="grid-column: 1/-1; text-align: center; color: #666; padding: 1rem;">Produkte konnten nicht geladen werden.</p>';
            return;
        }
    }

    const filteredProducts = products.filter((product) => matchesProductSearch(product, queryRaw));

    if (filteredProducts.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results" style="grid-column: 1/-1; text-align: center; color: #666; padding: 1rem;">Keine Düfte gefunden.</p>';
        return;
    }

    resultsContainer.innerHTML = filteredProducts.slice(0, 6).map(product => {
        const defaultVariant = product.variants[30] || product.variants[50];
        const price = defaultVariant ? defaultVariant.price : 0;
        const inspiredByShort = product.inspiredBy ? product.inspiredBy.split(' - ')[0] : '';
        const safeProductUrlId = sanitizeProductUrlId(product.id);
        const safeImage = safeImageSrc((product.images && product.images.length > 0) ? product.images[0] : 'logo.webp');
        const safeName = escapeHtml(product.name || '');
        const safeCode = escapeHtml(String(product.name || '').replace(/\s*\(\d+ml\)/, '').replace(/^No\.\s*/i, ''));
        const safeTitle = inspiredByShort ? `...${escapeHtml(stripBrandName(inspiredByShort))}&reg;` : safeName;

        return `
        <div class="product-card" onclick="window.location.href='product.html?id=${safeProductUrlId}'" style="cursor: pointer;">
            <div class="product-image-wrapper">
                <img src="${safeImage}" 
                     alt="${safeName}" 
                     class="product-grid-image"
                     onerror="this.style.display='none'">
            </div>
            <div class="product-info">
                <p class="product-code">NØTE. ${safeCode}</p>
                <h3 class="product-title">${safeTitle}</h3>
                <div class="product-price">ab ${price.toFixed(2)} €</div>
            </div>
        </div>
    `}).join('');

    // "Alle Ergebnisse" link at the bottom
    const showAllLink = document.createElement('a');
    showAllLink.href = `suche?q=${encodeURIComponent(queryRaw.trim())}`;
    showAllLink.style.cssText = 'display:block; text-align:center; padding: 12px 16px; font-size:0.83rem; font-weight:600; color:#000; text-decoration:none; border-top:1px solid #f0f0f0; background:#fafafa; border-radius: 0 0 14px 14px; letter-spacing:0.03em;';
    showAllLink.textContent = `Alle ${filteredProducts.length} Ergebnisse anzeigen →`;
    resultsContainer.appendChild(showAllLink);
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
document.addEventListener('DOMContentLoaded', syncUserLoginIndicator);
// Also try immediately (useful if script is at end of body)
initIntroText();
syncUserLoginIndicator();

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
function ensureNewArrivalsNavigationLink() {
    document.querySelectorAll('.main-nav, .nav-links').forEach((navigation) => {
        const links = Array.from(navigation.querySelectorAll('a'));
        let link = links.find((item) => /^Neuheiten$/i.test(String(item.textContent || '').trim()));
        if (!link) {
            link = document.createElement('a');
            link.textContent = 'Neuheiten';
        }
        link.href = 'neuheiten.html';

        const collectionLink = links.find((item) =>
            /^(Kollektion|Shop)$/i.test(String(item.textContent || '').trim())
        );
        if (collectionLink) {
            collectionLink.insertAdjacentElement('beforebegin', link);
        } else {
            navigation.prepend(link);
        }
    });
}

ensureNewArrivalsNavigationLink();
handleCheckoutReturnState();
initBrandVideoAutoplay();
init();
initIntroText(); // Run on startup
setupCartSwipeToClose();

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

function setDeliveryMethod(method) {
    currentDeliveryMethod = method;
    document.querySelectorAll('.delivery-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btn-' + method).classList.add('active');

    const checkoutBtn = document.querySelector('.btn-checkout');

    if (method === 'pickup') {
        document.getElementById('pickup-form').style.display = 'block';
        document.querySelector('.shipping-progress-container').style.display = 'none';
        if (checkoutBtn) checkoutBtn.innerHTML = '<i class="fas fa-store"></i> Reservieren & Barzahlung';
    } else {
        document.getElementById('pickup-form').style.display = 'none';
        document.querySelector('.shipping-progress-container').style.display = 'block';
        if (checkoutBtn) checkoutBtn.innerHTML = '<i class="fas fa-lock"></i> Sicher zur Kasse';
    }
    updateCartUI();
}
window.setDeliveryMethod = setDeliveryMethod;

// Sync top banner animation across page loads
function syncBannerAnimation() {
    const bannerTrack = document.querySelector('.top-banner-track');
    if (bannerTrack) {
        // Die Animation dauert 50s. Wir berechnen den negativen Delay basierend auf der aktuellen Zeit.
        // Dadurch sind alle Banner (auch auf verschiedenen Geräten/Tabs) völlig synchron.
        const seconds = Math.floor(Date.now() / 1000);
        const delay = -(seconds % 50);
        bannerTrack.style.animationDelay = delay + 's';
    }
}
document.addEventListener('DOMContentLoaded', syncBannerAnimation);
syncBannerAnimation(); // also run immediately if possible
