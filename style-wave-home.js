document.querySelectorAll(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
        const item = button.closest(".faq-item");
        if (!item) return;
        item.classList.toggle("active");
    });
});

const searchPanel = document.querySelector("[data-search-panel]");
const searchInput = document.querySelector("#preview-search");
const searchOpenButton = document.querySelector("[data-search-open]");
const cartDrawer = document.querySelector("[data-cart-drawer]");
const drawerBackdrop = document.querySelector("[data-drawer-backdrop]");
const mainNav = document.querySelector("#main-navigation");
const mobileMenuButton = document.querySelector("[data-mobile-menu-toggle]");
const cartItemsRoot = document.querySelector("[data-cart-items]");
const cartFooter = document.querySelector("[data-cart-footer]");
const cartTotal = document.querySelector("[data-cart-total]");
const cartStatus = document.querySelector("[data-cart-status]");
const cartCheckoutButton = document.querySelector("[data-cart-checkout]");
const cartSubtotal = document.querySelector("[data-cart-subtotal]");
const cartShipping = document.querySelector("[data-cart-shipping]");
const cartDiscount = document.querySelector("[data-cart-discount]");
const cartDiscountRow = document.querySelector("[data-cart-discount-row]");
const cartShippingMessage = document.querySelector("[data-cart-shipping-message]");
const cartShippingPercent = document.querySelector("[data-cart-shipping-percent]");
const cartShippingBar = document.querySelector("[data-cart-shipping-bar]");
const cartCouponForm = document.querySelector("[data-cart-coupon-form]");
const cartCouponInput = document.querySelector("[data-cart-coupon]");
const cartCouponMessage = document.querySelector("[data-cart-coupon-message]");
const cartPickupFields = document.querySelector("[data-cart-pickup]");
const cartUpsell = document.querySelector("[data-cart-upsell]");
const cartPaymentLabels = document.querySelector(".cart-payment-labels");
const newsletterForm = document.querySelector("[data-newsletter-form]");
const newsletterStatus = document.querySelector("[data-newsletter-status]");
const searchSuggestions = document.querySelector("[data-search-suggestions]");

function ensurePrimaryNavigationOrder() {
    document.querySelectorAll(".main-nav, .nav-links").forEach((navigation) => {
        const links = Array.from(navigation.querySelectorAll(":scope > a"));
        const collectionLink = links.find((link) => /^(Kollektion|Shop)$/i.test(String(link.textContent || "").trim()));
        let newArrivalsLink = links.find((link) => /^Neuheiten$/i.test(String(link.textContent || "").trim()));

        if (!newArrivalsLink) {
            newArrivalsLink = document.createElement("a");
            newArrivalsLink.textContent = "Neuheiten";
        }
        newArrivalsLink.href = "neuheiten.html";

        if (collectionLink) {
            navigation.insertBefore(newArrivalsLink, collectionLink);
        } else {
            navigation.prepend(newArrivalsLink);
        }
    });
}

ensurePrimaryNavigationOrder();

let drawerDeliveryMethod = "shipping";
let storefrontProducts = [];
let storefrontProductsPromise = null;
const BESTSELLER_CART_IMAGE_BY_ID = Object.freeze({
    L12: "images_website/bestsellers/l12-comparison-transparent-v2.webp",
    L56: "images_website/bestsellers/l56-comparison-transparent-v2.webp",
    L62: "images_website/bestsellers/l62-comparison-transparent-v2.webp",
    L73: "images_website/bestsellers/l73-comparison-transparent-v2.webp",
    L123: "images_website/bestsellers/l123-comparison-transparent-v2.webp",
    L145: "images_website/bestsellers/l145-comparison-transparent-v2.webp",
    L146: "images_website/bestsellers/l146-comparison-transparent-v2.webp",
    L147: "images_website/bestsellers/l147-comparison-transparent-v2.webp",
    L155: "images_website/bestsellers/l155-comparison-transparent-v2.webp",
    L190: "images_website/bestsellers/l190-comparison-transparent-v2.webp",
    G111: "images_website/bestsellers/g111-comparison-transparent-v1.webp",
    G160: "images_website/bestsellers/g160-comparison-transparent-v2.webp",
    G169: "images_website/bestsellers/g169-comparison-transparent-v2.webp",
    G223: "images_website/bestsellers/g223-comparison-transparent-v1.webp",
    G232: "images_website/bestsellers/g232-comparison-transparent-v1.webp",
    G245: "images_website/bestsellers/g245-comparison-transparent-v1.webp",
    G263: "images_website/bestsellers/g263-comparison-transparent-v1.webp",
    G282: "images_website/bestsellers/g282-comparison-transparent-v1.webp",
    G298: "images_website/bestsellers/g298-comparison-transparent-v1.webp",
    G307: "images_website/bestsellers/g307-comparison-transparent-v2.webp",
    G322: "images_website/bestsellers/g322-comparison-transparent-v2.webp"
});

// API_BASE_URL: falls script.js schon geladen wurde, dessen Wert am window
// wiederverwenden, sonst selbst setzen. (window.API_BASE_URL, kein top-level const,
//  sonst "Identifier has already been declared" beim Laden beider Skripte.)
window.API_BASE_URL = window.API_BASE_URL || (["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://localhost:4242"
    : "https://note-backend-5gy0.onrender.com");

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function safeImageSource(value) {
    const source = String(value || "").trim();
    if (!source || /^(?:javascript|data):/i.test(source)) return "logo.webp";
    return escapeHtml(source);
}

function normalizeStorefrontProductPrices(items) {
    return items.map((product) => {
        if (product?.newArrival !== true || !product.variants?.["30"]) return product;
        return {
            ...product,
            variants: {
                ...product.variants,
                "30": { ...product.variants["30"], price: 19.99 }
            }
        };
    });
}

function renderCartPaymentLogos() {
    if (!cartPaymentLabels) return;
    cartPaymentLabels.innerHTML = `
        <span class="cart-payment-logo" title="Visa"><img src="images_website/payments/visa.svg" alt="Visa"></span>
        <span class="cart-payment-logo" title="Mastercard"><img src="images_website/payments/mastercard.svg" alt="Mastercard"></span>
        <span class="cart-payment-logo cart-payment-logo-amex" title="American Express"><img src="images_website/payments/amex.svg" alt="American Express"></span>
        <span class="cart-payment-logo" title="PayPal"><img src="images_website/payments/paypal.svg" alt="PayPal"></span>
        <span class="cart-payment-logo" title="Apple Pay"><img src="images_website/payments/apple-pay.svg" alt="Apple Pay"></span>
        <span class="cart-payment-logo" title="Google Pay"><img src="images_website/payments/google-pay.svg" alt="Google Pay"></span>
        <span class="cart-payment-logo cart-payment-logo-klarna" title="Klarna" aria-label="Klarna">Klarna.</span>`;
}

function readCart() {
    try {
        const parsed = JSON.parse(localStorage.getItem("cart") || "[]");
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((item) => item && Number(item.quantity) > 0 && Number(item.price) >= 0);
    } catch (error) {
        return [];
    }
}

function writeCart(items) {
    localStorage.setItem("cart", JSON.stringify(items));
    renderCart();
    window.dispatchEvent(new CustomEvent("note:cart-updated-by-drawer"));
}

function formatPrice(value) {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value) || 0);
}

async function loadStorefrontProducts() {
    if (storefrontProducts.length) return storefrontProducts;
    if (!storefrontProductsPromise) {
        storefrontProductsPromise = fetch(`${window.API_BASE_URL}/api/products`, { credentials: "include" })
            .then((response) => {
                if (!response.ok) throw new Error("Produkte konnten nicht geladen werden.");
                return response.json();
            })
            .then((items) => {
                storefrontProducts = Array.isArray(items) ? normalizeStorefrontProductPrices(items) : [];
                return storefrontProducts;
            })
            .finally(() => {
                storefrontProductsPromise = null;
            });
    }
    return storefrontProductsPromise;
}

async function syncBestsellerCardPrices() {
    const cards = Array.from(document.querySelectorAll(".bestseller-section .product-card[href*='product?id=']"));
    if (!cards.length) return;

    try {
        const products = await loadStorefrontProducts();
        const productsById = new Map(products.map((product) => [String(product?.id || ""), product]));

        cards.forEach((card) => {
            const productId = new URL(card.href, window.location.href).searchParams.get("id");
            const variant = productsById.get(String(productId || ""))?.variants?.["30"];
            if (!variant) return;

            const oldPrice = card.querySelector(".product-price s");
            const currentPrice = card.querySelector(".product-price span");
            if (oldPrice && Number.isFinite(Number(variant.originalPrice))) {
                oldPrice.textContent = formatPrice(variant.originalPrice);
            }
            if (currentPrice && Number.isFinite(Number(variant.price))) {
                currentPrice.textContent = `ab ${formatPrice(variant.price)}`;
            }
        });
    } catch (error) {
        // Die im HTML hinterlegten Preise bleiben als Fallback sichtbar.
    }
}

syncBestsellerCardPrices();

function getDrawerTotals(items) {
    const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
    const couponCode = String(localStorage.getItem("couponCode") || "").trim();
    const discountRate = couponCode
        ? Math.max(0, Math.min(Number(localStorage.getItem("discount") || 0), 1))
        : 0;
    const discountAmount = subtotal * discountRate;
    const freeShipping = localStorage.getItem("couponFreeShipping") === "1" || subtotal >= 60;
    const shippingCost = drawerDeliveryMethod === "shipping" && !freeShipping ? 6.99 : 0;
    return { subtotal, discountRate, discountAmount, shippingCost, total: subtotal - discountAmount + shippingCost, freeShipping };
}

async function renderCartUpsell(items) {
    if (!cartUpsell || !items.length) return;
    try {
        const products = await loadStorefrontProducts();
        const ids = new Set(items.map((item) => String(item.productId || "")));
        const suggestion = products.find((product) => product?.bestseller && !ids.has(String(product.id)))
            || products.find((product) => !ids.has(String(product.id)));
        if (!suggestion) {
            cartUpsell.innerHTML = "";
            return;
        }
        const image = safeImageSource(suggestion.images?.[0]);
        const variant = suggestion.variants?.[30] || suggestion.variants?.[50] || Object.values(suggestion.variants || {})[0];
        cartUpsell.innerHTML = `
            <span>Dazu passt</span>
            <a href="product.html?id=${encodeURIComponent(String(suggestion.id || ""))}">
                <img src="${image}" alt="${escapeHtml(suggestion.name || "Duft entdecken")}">
                <strong>${escapeHtml(suggestion.name || "Duft entdecken")}</strong>
                <small>${variant ? `ab ${formatPrice(variant.price)}` : "Ansehen"}</small>
            </a>`;
    } catch (error) {
        cartUpsell.innerHTML = "";
    }
}

async function syncCartProductImages(items) {
    if (!cartItemsRoot || !items.length) return;

    try {
        const products = await loadStorefrontProducts();
        const productsById = new Map(products.map((product) => [String(product?.id || ""), product]));
        let cartChanged = false;

        items.forEach((item) => {
            const productId = String(item.productId || String(item.id || "").replace(/-\d+$/, ""));
            const product = productsById.get(productId);
            const firstImage = BESTSELLER_CART_IMAGE_BY_ID[productId] || product?.images?.[0];
            if (firstImage && item.image !== firstImage) {
                item.image = firstImage;
                cartChanged = true;
            }

            const size = String(item.size || "").replace(/[^0-9]/g, "");
            const variant = product?.newArrival === true && size === "30" ? product.variants?.["30"] : null;
            if (variant && Number.isFinite(Number(variant.price)) && Number(item.price) !== Number(variant.price)) {
                item.price = Number(variant.price);
                cartChanged = true;
            }
            if (variant && Number.isFinite(Number(variant.originalPrice)) && Number(item.originalPrice) !== Number(variant.originalPrice)) {
                item.originalPrice = Number(variant.originalPrice);
                cartChanged = true;
            }
        });

        const itemsByCartId = new Map(items.map((item) => [String(item.cartId || ""), item]));
        cartItemsRoot.querySelectorAll("[data-cart-id]").forEach((row) => {
            const item = itemsByCartId.get(String(row.dataset.cartId || ""));
            const image = row.querySelector("img");
            if (item?.image && image) image.src = item.image;
        });

        if (cartChanged) localStorage.setItem("cart", JSON.stringify(items));
    } catch (error) {
        // Das gespeicherte Warenkorbbild bleibt als Offline-Fallback erhalten.
    }
}

function renderCart() {
    if (!cartItemsRoot) return;
    const items = readCart();
    const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const totals = getDrawerTotals(items);

    document.querySelectorAll(".cart-count").forEach((element) => {
        element.textContent = String(itemCount);
    });
    const drawerCount = cartDrawer?.querySelector(".cart-drawer-header span");
    if (drawerCount) drawerCount.textContent = String(itemCount);
    if (cartSubtotal) cartSubtotal.textContent = formatPrice(totals.subtotal);
    if (cartDiscount) cartDiscount.textContent = `−${formatPrice(totals.discountAmount)}`;
    if (cartDiscountRow) cartDiscountRow.hidden = totals.discountAmount <= 0;
    if (cartCouponMessage) {
        const couponCode = String(localStorage.getItem("couponCode") || "").trim();
        const couponLabel = String(localStorage.getItem("couponLabel") || "").trim();
        if (totals.discountRate > 0 && couponCode) {
            cartCouponMessage.textContent = "";
            const couponText = document.createElement("span");
            couponText.textContent = `Gutschein ${couponCode} aktiv${couponLabel ? ` (${couponLabel})` : ""}.`;
            const removeCouponButton = document.createElement("button");
            removeCouponButton.type = "button";
            removeCouponButton.className = "cart-coupon-remove";
            removeCouponButton.dataset.cartCouponRemove = "";
            removeCouponButton.setAttribute("aria-label", `Gutschein ${couponCode} entfernen`);
            removeCouponButton.textContent = "×";
            cartCouponMessage.append(couponText, removeCouponButton);
            cartCouponMessage.classList.add("is-success");
        } else if (!cartCouponMessage.textContent.includes("wird geprüft")) {
            cartCouponMessage.textContent = "";
            cartCouponMessage.classList.remove("is-success");
        }
    }
    if (cartShipping) cartShipping.textContent = drawerDeliveryMethod === "pickup" ? "Abholung" : (totals.freeShipping ? "Kostenlos" : formatPrice(totals.shippingCost));
    if (cartTotal) cartTotal.textContent = formatPrice(totals.total);
    const shippingProgress = Math.max(0, Math.min((totals.subtotal / 60) * 100, 100));
    if (cartShippingBar) cartShippingBar.style.width = `${shippingProgress}%`;
    if (cartShippingPercent) cartShippingPercent.textContent = `${Math.round(shippingProgress)}%`;
    if (cartShippingMessage) {
        const remaining = Math.max(0, 60 - totals.subtotal);
        cartShippingMessage.textContent = totals.freeShipping
            ? "Kostenloser Versand ist erreicht"
            : `Noch ${formatPrice(remaining)} bis zum kostenlosen Versand`;
    }
    if (cartFooter) cartFooter.hidden = items.length === 0;
    cartItemsRoot.classList.toggle("has-items", items.length > 0);

    if (!items.length) {
        cartItemsRoot.innerHTML = `
            <div class="cart-empty-state">
                <p>Dein Warenkorb ist leer.</p>
                <a class="btn btn-dark" href="index.html#bestseller">Bestseller ansehen</a>
            </div>`;
        return;
    }

    cartItemsRoot.innerHTML = items.map((item) => {
        const cartId = escapeHtml(item.cartId || "");
        const productId = escapeHtml(item.productId || String(item.id || "").replace(/-\d+$/, ""));
        const name = escapeHtml(String(item.name || "NØTE. fragrance").replace(/\s*\(\d+ml\)\s*$/i, ""));
        const image = safeImageSource(item.image);
        const quantity = Math.max(1, Number(item.quantity) || 1);
        const linePrice = Number(item.price || 0) * quantity;
        const originalLinePrice = Number(item.originalPrice || 0) * quantity;
        const hasSaving = originalLinePrice > linePrice;
        return `
            <article class="wave-cart-item" data-cart-id="${cartId}">
                <a class="wave-cart-image" href="product.html?id=${encodeURIComponent(productId)}">
                    <img src="${image}" alt="${name}">
                </a>
                <div class="wave-cart-copy">
                    <a href="product.html?id=${encodeURIComponent(productId)}">${name}</a>
                    <small>${escapeHtml(item.size || "50")} ml · ${formatPrice(item.price)} je Flakon</small>
                    <div class="wave-cart-quantity" aria-label="Menge ändern">
                        <button type="button" data-cart-action="decrease" aria-label="Menge verringern">−</button>
                        <strong>${quantity}</strong>
                        <button type="button" data-cart-action="increase" aria-label="Menge erhöhen">+</button>
                        <button class="wave-cart-remove" type="button" data-cart-action="remove">Entfernen</button>
                    </div>
                </div>
                <div class="wave-cart-price">
                    ${hasSaving ? `<s>${formatPrice(originalLinePrice)}</s>` : ""}
                    <strong>${formatPrice(linePrice)}</strong>
                    ${hasSaving ? `<small>${formatPrice(originalLinePrice - linePrice)} gespart</small>` : ""}
                </div>
            </article>`;
    }).join("");
    syncCartProductImages(items);
    renderCartUpsell(items);
}

cartCouponMessage?.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-cart-coupon-remove]");
    if (!removeButton) return;

    localStorage.removeItem("discount");
    localStorage.removeItem("couponCode");
    localStorage.removeItem("couponLabel");
    localStorage.removeItem("couponFreeShipping");
    if (cartCouponInput) {
        cartCouponInput.value = "";
        cartCouponInput.disabled = false;
    }
    window.dispatchEvent(new CustomEvent("note:coupon-removed"));
    renderCart();
});

function changeCartItem(cartId, action) {
    const items = readCart();
    const item = items.find((entry) => String(entry.cartId || "") === cartId);
    if (!item) return;
    if (action === "increase") item.quantity = Number(item.quantity || 0) + 1;
    if (action === "decrease") item.quantity = Number(item.quantity || 0) - 1;
    const nextItems = action === "remove" ? items.filter((entry) => entry !== item) : items.filter((entry) => Number(entry.quantity) > 0);
    writeCart(nextItems);
}

async function getCsrfToken() {
    const response = await fetch(`${window.API_BASE_URL}/api/csrf-token`, { credentials: "include" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.csrfToken) throw new Error("Sicherheits-Token konnte nicht geladen werden.");
    return payload.csrfToken;
}

async function startCheckout() {
    const items = readCart();
    if (!items.length || !cartCheckoutButton) return;
    cartCheckoutButton.disabled = true;
    if (cartStatus) cartStatus.textContent = "Sicherer Checkout wird vorbereitet…";
    try {
        const csrfToken = await getCsrfToken();
        const couponCode = String(localStorage.getItem("couponCode") || "").trim();

        if (drawerDeliveryMethod === "pickup") {
            const customerName = String(document.querySelector("[data-cart-pickup-name]")?.value || "").trim();
            const customerEmail = String(document.querySelector("[data-cart-pickup-email]")?.value || "").trim();
            if (!customerName || !customerEmail) {
                throw new Error("Bitte gib für die Abholung deinen Namen und deine E-Mail-Adresse ein.");
            }
            const pickupResponse = await fetch(`${window.API_BASE_URL}/create-pickup-order`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
                body: JSON.stringify({
                    items: items.map((item) => ({ id: item.id, quantity: Number(item.quantity) })),
                    customerName,
                    customerEmail,
                    couponCode: couponCode || undefined
                })
            });
            const pickupPayload = await pickupResponse.json().catch(() => ({}));
            if (!pickupResponse.ok) throw new Error(pickupPayload.error || "Abholung konnte nicht reserviert werden.");
            sessionStorage.setItem("isPickupOrder", "true");
            writeCart([]);
            window.location.assign("success.html?pickup=true");
            return;
        }

        const requestBody = {
            items: items.map((item) => ({ id: item.id, quantity: Number(item.quantity) }))
        };
        if (couponCode) requestBody.couponCode = couponCode;
        const response = await fetch(`${window.API_BASE_URL}/create-checkout-session`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
            body: JSON.stringify(requestBody)
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Checkout konnte nicht gestartet werden.");
        if (payload.safeMode) {
            if (cartStatus) cartStatus.textContent = "Lokaler Safe-Mode: Es wurde keine Zahlung ausgelöst.";
            return;
        }
        if (!payload.url) throw new Error("Keine Checkout-Adresse erhalten.");
        sessionStorage.setItem("stripe_checkout_pending", "1");
        window.location.assign(payload.url);
    } catch (error) {
        if (cartStatus) cartStatus.textContent = error.message || "Checkout konnte nicht gestartet werden.";
    } finally {
        cartCheckoutButton.disabled = false;
    }
}

async function applyDrawerCoupon(event) {
    event.preventDefault();
    const code = String(cartCouponInput?.value || "").trim().toUpperCase();
    if (!code || !cartCouponMessage) return;
    cartCouponMessage.textContent = "Gutschein wird geprüft…";
    try {
        const csrfToken = await getCsrfToken();
        const response = await fetch(`${window.API_BASE_URL}/api/validate-coupon`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
            body: JSON.stringify({ code })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.valid) throw new Error(payload.error || "Der Gutscheincode ist ungültig oder bereits verbraucht.");
        localStorage.setItem("discount", String(Number(payload.discount || 0) / 100));
        localStorage.setItem("couponCode", String(payload.code || code));
        localStorage.setItem("couponLabel", String(payload.label || `${payload.discount}% Rabatt`));
        localStorage.setItem("couponFreeShipping", payload.freeShipping ? "1" : "0");
        cartCouponMessage.textContent = payload.label || "Gutschein wurde aktiviert.";
        renderCart();
    } catch (error) {
        localStorage.removeItem("discount");
        localStorage.removeItem("couponCode");
        localStorage.removeItem("couponLabel");
        localStorage.removeItem("couponFreeShipping");
        cartCouponMessage.textContent = error.message || "Gutschein konnte nicht geprüft werden.";
        renderCart();
    }
}

async function submitWaveNewsletter(event) {
    event.preventDefault();
    if (!newsletterForm || !newsletterStatus) return;
    const input = newsletterForm.querySelector('input[type="email"]');
    const button = newsletterForm.querySelector('button[type="submit"]');
    const email = String(input?.value || "").trim();
    if (!email || !input.checkValidity()) {
        input?.reportValidity();
        return;
    }
    button.disabled = true;
    newsletterStatus.textContent = "Anmeldung wird gesendet…";
    try {
        const csrfToken = await getCsrfToken();
        const response = await fetch(`${window.API_BASE_URL}/api/newsletter`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
            body: JSON.stringify({ email })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Anmeldung fehlgeschlagen.");
        newsletterStatus.textContent = payload.message || "Bitte bestätige deine Anmeldung per E-Mail.";
        newsletterForm.reset();
    } catch (error) {
        newsletterStatus.textContent = error.message || "Anmeldung fehlgeschlagen.";
    } finally {
        button.disabled = false;
    }
}

function setMobileMenu(open) {
    if (!mainNav || !mobileMenuButton) return;
    mainNav.classList.toggle("is-open", open);
    mobileMenuButton.setAttribute("aria-expanded", String(open));
    mobileMenuButton.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
}

function closeMobileMenu() {
    setMobileMenu(false);
}

function openSearchPanel() {
    if (!searchPanel) return;
    closeMobileMenu();
    positionSearchPanel();
    searchPanel.classList.add("is-open");
    searchPanel.setAttribute("aria-hidden", "false");
    searchOpenButton?.setAttribute("aria-expanded", "true");
    window.setTimeout(() => {
        searchInput?.focus();
        positionSearchPanel();
    }, 120);
}

function closeSearchPanel() {
    if (!searchPanel) return;
    searchPanel.classList.remove("is-open");
    searchPanel.setAttribute("aria-hidden", "true");
    searchOpenButton?.setAttribute("aria-expanded", "false");
    searchPanel.classList.remove("has-results");
    if (searchSuggestions) searchSuggestions.innerHTML = "";
}

function normalizeStorefrontSearch(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

let searchRequestId = 0;
async function renderSearchSuggestions() {
    if (!searchInput || !searchSuggestions || !searchPanel) return;
    const query = normalizeStorefrontSearch(searchInput.value);
    const requestId = ++searchRequestId;
    if (query.length < 2) {
        searchSuggestions.innerHTML = "";
        searchPanel.classList.remove("has-results");
        return;
    }
    searchSuggestions.innerHTML = '<p class="search-panel-message">Düfte werden geladen…</p>';
    searchPanel.classList.add("has-results");
    try {
        const products = await loadStorefrontProducts();
        if (requestId !== searchRequestId) return;
        const matches = products.filter((product) => {
            const notes = Object.values(product?.notes || {}).join(" ");
            return normalizeStorefrontSearch([
                product?.name,
                product?.inspiredBy,
                product?.description,
                notes
            ].join(" ")).includes(query);
        });
        if (!matches.length) {
            searchSuggestions.innerHTML = '<p class="search-panel-message">Keine passenden Düfte gefunden.</p>';
            return;
        }
        const cards = matches.slice(0, 4).map((product) => {
            const variant = product.variants?.[30] || product.variants?.[50] || Object.values(product.variants || {})[0];
            return `
                <a class="search-suggestion" href="product.html?id=${encodeURIComponent(String(product.id || ""))}">
                    <img src="${safeImageSource(product.images?.[0])}" alt="${escapeHtml(product.name || "NØTE. Duft")}">
                    <span><strong>${escapeHtml(product.name || "NØTE. Duft")}</strong><small>${variant ? `ab ${formatPrice(variant.price)}` : "Details ansehen"}</small></span>
                </a>`;
        }).join("");
        searchSuggestions.innerHTML = `${cards}<a class="search-show-all" href="suche.html?q=${encodeURIComponent(searchInput.value.trim())}">Alle Ergebnisse ansehen</a>`;
    } catch (error) {
        if (requestId !== searchRequestId) return;
        searchSuggestions.innerHTML = '<p class="search-panel-message">Die Suche ist gerade nicht erreichbar.</p>';
    }
}

function positionSearchPanel() {
    if (!searchPanel || !searchOpenButton) return;
    const buttonRect = searchOpenButton.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const panelWidth = Math.min(390, viewportWidth - 24);
    const idealLeft = buttonRect.right - panelWidth + 22;
    const left = Math.max(12, Math.min(idealLeft, viewportWidth - panelWidth - 12));

    searchPanel.style.top = `${Math.round(buttonRect.bottom + 8)}px`;
    searchPanel.style.left = `${Math.round(left)}px`;
    searchPanel.style.width = `${Math.round(panelWidth)}px`;
}

function openCartDrawer() {
    if (!cartDrawer || !drawerBackdrop) return;
    closeMobileMenu();
    cartDrawer.classList.add("is-open");
    drawerBackdrop.classList.add("is-open");
    cartDrawer.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("cart-drawer-open");
    renderCart();
}

function closeCartDrawer() {
    if (!cartDrawer || !drawerBackdrop) return;
    cartDrawer.classList.remove("is-open");
    drawerBackdrop.classList.remove("is-open");
    cartDrawer.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("cart-drawer-open");
}

searchOpenButton?.addEventListener("click", () => {
    if (searchPanel?.classList.contains("is-open")) {
        closeSearchPanel();
        return;
    }
    openSearchPanel();
});
searchInput?.addEventListener("input", renderSearchSuggestions);
mobileMenuButton?.addEventListener("click", () => {
    const shouldOpen = !mainNav?.classList.contains("is-open");
    closeSearchPanel();
    setMobileMenu(shouldOpen);
});
mainNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMobileMenu));
document.querySelector("[data-search-close]")?.addEventListener("click", closeSearchPanel);
document.querySelector("[data-cart-open]")?.addEventListener("click", openCartDrawer);
window.addEventListener("note:cart-updated", () => {
    renderCart();
    openCartDrawer();
});
// Wenn das alte script.js einen Artikel in den Warenkorb legt, neuen Drawer öffnen
window.addEventListener("note:open-cart", () => {
    if (cartDrawer) openCartDrawer();
});
document.querySelector("[data-cart-close]")?.addEventListener("click", closeCartDrawer);
drawerBackdrop?.addEventListener("click", closeCartDrawer);
cartItemsRoot?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cart-action]");
    const item = button?.closest("[data-cart-id]");
    if (!button || !item) return;
    changeCartItem(item.dataset.cartId || "", button.dataset.cartAction || "");
});
cartCheckoutButton?.addEventListener("click", startCheckout);
cartCouponForm?.addEventListener("submit", applyDrawerCoupon);
document.querySelectorAll("[data-cart-delivery]").forEach((button) => {
    button.addEventListener("click", () => {
        drawerDeliveryMethod = button.dataset.cartDelivery === "pickup" ? "pickup" : "shipping";
        document.querySelectorAll("[data-cart-delivery]").forEach((entry) => entry.classList.toggle("is-active", entry === button));
        if (cartPickupFields) cartPickupFields.hidden = drawerDeliveryMethod !== "pickup";
        renderCart();
    });
});
newsletterForm?.addEventListener("submit", submitWaveNewsletter);
window.addEventListener("storage", (event) => {
    if (event.key === "cart") renderCart();
});
// Wenn das alte script.js den Warenkorb aendert, neu rendern (gleicher Tab).
window.addEventListener("note:cart-changed", renderCart);
renderCartPaymentLogos();
renderCart();

document.addEventListener("pointerdown", (event) => {
    if (!searchPanel?.classList.contains("is-open")) return;
    if (searchPanel.contains(event.target) || searchOpenButton?.contains(event.target)) return;
    closeSearchPanel();
});

window.addEventListener("resize", () => {
    if (searchPanel?.classList.contains("is-open")) positionSearchPanel();
    if (window.innerWidth > 980) closeMobileMenu();
});

window.addEventListener("scroll", () => {
    if (searchPanel?.classList.contains("is-open")) positionSearchPanel();
}, { passive: true });

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeSearchPanel();
    closeCartDrawer();
    closeMobileMenu();
});

const revealItems = Array.from(document.querySelectorAll(".reveal-item"));
const storyScenes = Array.from(document.querySelectorAll("[data-story-scene]"));
const sprayFrameStacks = Array.from(document.querySelectorAll("[data-spray-frames]"));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

revealItems.forEach((item) => {
    const group = item.closest(".reveal-group");
    if (!group) return;
    const siblings = Array.from(group.querySelectorAll(".reveal-item"));
    const index = siblings.indexOf(item);
    item.style.setProperty("--reveal-delay", `${Math.min(index * 90, 360)}ms`);
});

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    storyScenes.forEach((scene) => scene.style.setProperty("--story-progress", "1"));
    sprayFrameStacks.forEach((stack) => {
        const frames = Array.from(stack.querySelectorAll(".spray-frame"));
        frames.forEach((frame, index) => frame.style.setProperty("--frame-opacity", index === frames.length - 1 ? "1" : "0"));
    });
} else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, {
        root: null,
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.16
    });

    revealItems.forEach((item) => revealObserver.observe(item));
}

const positionStoryConnectors = () => {
    storyScenes.forEach((scene) => {
        const connector = scene.querySelector(".story-connector");
        const anchor = scene.querySelector(".story-anchor");
        const callout = scene.querySelector(".story-callout");
        const media = scene.querySelector(".story-media");
        if (!connector || !anchor || !callout || !media) return;

        const sceneWidth = scene.clientWidth;
        const sceneRect = scene.getBoundingClientRect();
        const anchorRect = anchor.getBoundingClientRect();
        const calloutRect = callout.getBoundingClientRect();
        const anchorX = anchorRect.left + (anchorRect.width / 2) - sceneRect.left;
        const anchorY = anchorRect.top + (anchorRect.height / 2) - sceneRect.top;
        const calloutX = calloutRect.left - sceneRect.left;
        const calloutY = calloutRect.top - sceneRect.top;

        // The mobile story is stacked. Measure a real vertical connection from
        // the anchor dot inside the image to the top edge of its text card.
        if (window.matchMedia("(max-width: 980px)").matches) {
            connector.style.top = `${anchorY}px`;
            connector.style.left = `${anchorX - 1}px`;
            connector.style.right = "auto";
            connector.style.width = "2px";
            connector.style.height = `${Math.max(0, calloutY - anchorY)}px`;
            return;
        }

        connector.style.width = "";
        connector.style.height = "";

        const isRight = scene.classList.contains("story-scene-right");

        if (isRight) {
            // Media on the right, callout on the left.
            // Line runs from the callout's right edge to the anchor dot.
            const calloutEdgeX = calloutX + calloutRect.width;
            connector.style.top = `${anchorY}px`;
            connector.style.left = `${calloutEdgeX}px`;
            connector.style.right = `${sceneWidth - anchorX}px`;
        } else {
            // Media on the left, callout on the right.
            // Line runs from the anchor dot to the callout's left edge.
            const calloutEdgeX = calloutX;
            connector.style.top = `${anchorY}px`;
            connector.style.left = `${anchorX}px`;
            connector.style.right = `${sceneWidth - calloutEdgeX}px`;
        }
    });
};

const updateSprayFrames = () => {
    sprayFrameStacks.forEach((stack) => {
        const scene = stack.closest("[data-story-scene]");
        const frames = Array.from(stack.querySelectorAll(".spray-frame"));
        if (!scene || !frames.length) return;

        const progress = Math.max(0, Math.min(parseFloat(scene.dataset.storyProgress || "0"), 1));
        // Keep the first scene quiet on entry; the spray begins only after the product is clearly visible.
        const sprayProgress = Math.max(0, Math.min((progress - 0.46) / 0.54, 1));
        const framePosition = sprayProgress * (frames.length - 1);
        const lowerIndex = Math.floor(framePosition);
        const upperIndex = Math.min(lowerIndex + 1, frames.length - 1);
        const blend = framePosition - lowerIndex;
        const globalOpacity = Math.min(1, sprayProgress * 1.18);

        frames.forEach((frame, index) => {
            let opacity = 0;
            if (index === lowerIndex) opacity = 1 - blend;
            if (index === upperIndex) opacity = Math.max(opacity, blend);
            frame.style.setProperty("--frame-opacity", (opacity * globalOpacity).toFixed(3));
        });
    });
};

if (storyScenes.length && !prefersReducedMotion) {
    // Compute the raw target progress from the current scroll position.
    const computeTargets = () => {
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

        storyScenes.forEach((scene) => {
            const rect = scene.getBoundingClientRect();
            const start = viewportHeight * 0.84;
            const end = viewportHeight * 0.28;
            const rawProgress = (start - rect.top) / (start - end);
            const target = Math.max(0, Math.min(rawProgress, 1));

            scene.dataset.storyTarget = target.toFixed(3);
        });
    };

    // Easing factor: how quickly the displayed value catches up (0–1).
    const EASE = 0.12;
    let animating = false;

    const applyDisplayed = () => {
        let needsAnotherFrame = false;

        storyScenes.forEach((scene) => {
            const target = parseFloat(scene.dataset.storyTarget || "0");
            const current = parseFloat(scene.dataset.storyProgress || "0");
            const diff = target - current;

            if (Math.abs(diff) > 0.0005) {
                const next = current + diff * EASE;
                scene.dataset.storyProgress = next.toFixed(3);
                scene.style.setProperty("--story-progress", next.toFixed(3));
                needsAnotherFrame = true;
            } else {
                scene.dataset.storyProgress = target.toFixed(3);
                scene.style.setProperty("--story-progress", target.toFixed(3));
            }
        });

        positionStoryConnectors();
        updateSprayFrames();

        if (needsAnotherFrame) {
            window.requestAnimationFrame(applyDisplayed);
        } else {
            animating = false;
        }
    };

    const kick = () => {
        computeTargets();
        if (!animating) {
            animating = true;
            window.requestAnimationFrame(applyDisplayed);
        }
    };

    kick();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
} else {
    // Even without scroll animation, keep connectors aligned to the anchors.
    storyScenes.forEach((scene) => scene.style.setProperty("--story-progress", "1"));
    positionStoryConnectors();
    updateSprayFrames();
    window.addEventListener("resize", positionStoryConnectors);
}

// Re-measure once images/fonts have settled, so the layout is final.
window.addEventListener("load", () => {
    positionStoryConnectors();
    updateSprayFrames();
});

const initBestsellerRails = () => {
    document.querySelectorAll(".bestseller-section .product-rail").forEach((rail) => {
        if (rail.dataset.dragReady === "true") return;
        rail.dataset.dragReady = "true";

        const shell = rail.closest(".product-rail-shell");
        const previousButton = shell?.querySelector(".product-rail-arrow-prev");
        const nextButton = shell?.querySelector(".product-rail-arrow-next");
        const cards = Array.from(rail.querySelectorAll(".product-card"));

        const updateArrowState = () => {
            const hasOverflow = rail.scrollWidth > rail.clientWidth + 4;
            const atStart = rail.scrollLeft <= 4;
            const atEnd = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 4;

            if (previousButton) previousButton.disabled = !hasOverflow || atStart;
            if (nextButton) nextButton.disabled = !hasOverflow || atEnd;
        };

        const moveByPage = (direction) => {
            if (cards.length <= 3) return;

            const firstOffset = cards[0].offsetLeft;
            const pageDistance = cards[3].offsetLeft - firstOffset;
            const currentPage = Math.round(rail.scrollLeft / pageDistance);
            const lastPage = Math.ceil((cards.length - 3) / 3);
            const targetPage = Math.max(0, Math.min(lastPage, currentPage + direction));
            const targetIndex = Math.min(targetPage * 3, cards.length - 3);
            const targetLeft = cards[targetIndex].offsetLeft - firstOffset;

            rail.scrollTo({ left: targetLeft, behavior: "smooth" });
        };

        previousButton?.addEventListener("click", () => moveByPage(-1));
        nextButton?.addEventListener("click", () => moveByPage(1));

        let scrollFrame = 0;
        rail.addEventListener("scroll", () => {
            cancelAnimationFrame(scrollFrame);
            scrollFrame = requestAnimationFrame(updateArrowState);
        }, { passive: true });

        window.addEventListener("resize", updateArrowState, { passive: true });
        requestAnimationFrame(updateArrowState);

        let dragging = false;
        let dragged = false;
        let startX = 0;
        let startScrollLeft = 0;

        rail.addEventListener("pointerdown", (event) => {
            if (event.pointerType !== "mouse" || event.button !== 0) return;

            dragging = true;
            dragged = false;
            startX = event.clientX;
            startScrollLeft = rail.scrollLeft;
            rail.classList.add("is-dragging");
            rail.setPointerCapture(event.pointerId);
        });

        rail.addEventListener("pointermove", (event) => {
            if (!dragging) return;

            const distance = event.clientX - startX;
            if (Math.abs(distance) > 5) dragged = true;
            rail.scrollLeft = startScrollLeft - distance;
        });

        const stopDragging = (event) => {
            if (!dragging) return;
            dragging = false;
            rail.classList.remove("is-dragging");
            if (rail.hasPointerCapture(event.pointerId)) {
                rail.releasePointerCapture(event.pointerId);
            }
        };

        rail.addEventListener("pointerup", stopDragging);
        rail.addEventListener("pointercancel", stopDragging);
        rail.addEventListener("click", (event) => {
            if (!dragged) return;
            event.preventDefault();
            event.stopPropagation();
            dragged = false;
        }, true);
    });
};

initBestsellerRails();
