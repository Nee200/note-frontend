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
const newsletterForm = document.querySelector("[data-newsletter-form]");
const newsletterStatus = document.querySelector("[data-newsletter-status]");

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
}

function formatPrice(value) {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value) || 0);
}

function renderCart() {
    if (!cartItemsRoot) return;
    const items = readCart();
    const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);

    document.querySelectorAll(".cart-count").forEach((element) => {
        element.textContent = String(itemCount);
    });
    const drawerCount = cartDrawer?.querySelector(".cart-drawer-header span");
    if (drawerCount) drawerCount.textContent = String(itemCount);
    if (cartTotal) cartTotal.textContent = formatPrice(subtotal);
    if (cartFooter) cartFooter.hidden = items.length === 0;
    cartItemsRoot.classList.toggle("has-items", items.length > 0);

    if (!items.length) {
        cartItemsRoot.innerHTML = `
            <div class="cart-empty-state">
                <p>Dein Warenkorb ist leer.</p>
                <a class="btn btn-dark" href="#bestseller">Bestseller ansehen</a>
            </div>`;
        return;
    }

    cartItemsRoot.innerHTML = items.map((item) => {
        const cartId = escapeHtml(item.cartId || "");
        const productId = escapeHtml(item.productId || String(item.id || "").replace(/-\d+$/, ""));
        const name = escapeHtml(item.name || "NØTE. fragrance");
        const image = safeImageSource(item.image);
        const quantity = Math.max(1, Number(item.quantity) || 1);
        return `
            <article class="wave-cart-item" data-cart-id="${cartId}">
                <a class="wave-cart-image" href="product.html?id=${encodeURIComponent(productId)}">
                    <img src="${image}" alt="${name}">
                </a>
                <div class="wave-cart-copy">
                    <a href="product.html?id=${encodeURIComponent(productId)}">${name}</a>
                    <span>${formatPrice(Number(item.price) * quantity)}</span>
                    <div class="wave-cart-quantity" aria-label="Menge ändern">
                        <button type="button" data-cart-action="decrease" aria-label="Menge verringern">−</button>
                        <strong>${quantity}</strong>
                        <button type="button" data-cart-action="increase" aria-label="Menge erhöhen">+</button>
                        <button class="wave-cart-remove" type="button" data-cart-action="remove">Entfernen</button>
                    </div>
                </div>
            </article>`;
    }).join("");
}

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
        const requestBody = {
            items: items.map((item) => ({ id: item.id, quantity: Number(item.quantity) }))
        };
        const couponCode = String(localStorage.getItem("couponCode") || "").trim();
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

async function submitNewsletter(event) {
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
}

function positionSearchPanel() {
    if (!searchPanel || !searchOpenButton) return;
    const buttonRect = searchOpenButton.getBoundingClientRect();
    const panelWidth = Math.min(390, window.innerWidth - 24);
    const idealLeft = buttonRect.right - panelWidth + 22;
    const left = Math.max(12, Math.min(idealLeft, window.innerWidth - panelWidth - 12));

    searchPanel.style.top = `${Math.round(buttonRect.bottom + 8)}px`;
    searchPanel.style.left = `${Math.round(left)}px`;
}

function openCartDrawer() {
    if (!cartDrawer || !drawerBackdrop) return;
    closeMobileMenu();
    cartDrawer.classList.add("is-open");
    drawerBackdrop.classList.add("is-open");
    cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCartDrawer() {
    if (!cartDrawer || !drawerBackdrop) return;
    cartDrawer.classList.remove("is-open");
    drawerBackdrop.classList.remove("is-open");
    cartDrawer.setAttribute("aria-hidden", "true");
}

searchOpenButton?.addEventListener("click", () => {
    if (searchPanel?.classList.contains("is-open")) {
        closeSearchPanel();
        return;
    }
    openSearchPanel();
});
mobileMenuButton?.addEventListener("click", () => {
    const shouldOpen = !mainNav?.classList.contains("is-open");
    closeSearchPanel();
    setMobileMenu(shouldOpen);
});
mainNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMobileMenu));
document.querySelector("[data-search-close]")?.addEventListener("click", closeSearchPanel);
document.querySelector("[data-cart-open]")?.addEventListener("click", openCartDrawer);
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
newsletterForm?.addEventListener("submit", submitNewsletter);
window.addEventListener("storage", (event) => {
    if (event.key === "cart") renderCart();
});
// Wenn das alte script.js den Warenkorb aendert, neu rendern (gleicher Tab).
window.addEventListener("note:cart-changed", renderCart);
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

        // On mobile the connector is position:relative (vertical line).
        // Don't apply desktop inline positioning there.
        if (window.getComputedStyle(connector).position !== "absolute") {
            connector.style.top = "";
            connector.style.left = "";
            connector.style.right = "";
            return;
        }

        const sceneWidth = scene.clientWidth;

        // Use layout offsets instead of getBoundingClientRect, because the image
        // fades/scales in. Rects include transforms and can make the line drift.
        const anchorX = media.offsetLeft + anchor.offsetLeft;
        const anchorY = media.offsetTop + anchor.offsetTop;

        const isRight = scene.classList.contains("story-scene-right");

        if (isRight) {
            // Media on the right, callout on the left.
            // Line runs from the callout's right edge to the anchor dot.
            const calloutEdgeX = callout.offsetLeft + callout.offsetWidth;
            connector.style.top = `${anchorY}px`;
            connector.style.left = `${calloutEdgeX}px`;
            connector.style.right = `${sceneWidth - anchorX}px`;
        } else {
            // Media on the left, callout on the right.
            // Line runs from the anchor dot to the callout's left edge.
            const calloutEdgeX = callout.offsetLeft;
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
