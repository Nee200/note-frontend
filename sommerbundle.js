(() => {
    "use strict";

    const BUNDLE_SELECTION_KEY = "note_summer_bundle_v1";
    const COUNTDOWN_KEY = "note_summer_bundle_countdown_v1";
    const REQUIRED_SCENTS = 3;
    const PRODUCTS_PER_PAGE = 50;
    const REMOTE_PRODUCTS_URL = "https://note-backend-5gy0.onrender.com/api/products";
    const SIZE_OPTIONS = Object.freeze({
        30: Object.freeze({
            size: 30,
            displayPrice: 69,
            originalDisplayPrice: 104.97,
            saving: 35.97
        }),
        50: Object.freeze({
            size: 50,
            displayPrice: 99,
            originalDisplayPrice: 134.97,
            saving: 35.97
        })
    });

    const PRODUCT_FIRST_IMAGE_BY_ID = Object.freeze({
        L37: "images_website/bestsellers/l37-comparison-transparent-v3.webp",
        L93: "images_website/bestsellers/l93-comparison-transparent-v1.webp",
        L95: "images_website/bestsellers/l95-comparison-transparent-v1.webp",
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

    const FALLBACK_PRODUCTS = Object.freeze([
        {
            id: "G160",
            name: "No. G160",
            inspiredBy: "California Dream",
            category: "men",
            notes: { head: "Mandarine", heart: "Birne", base: "Moschus" },
            bestseller: true
        },
        {
            id: "G298",
            name: "No. G298",
            inspiredBy: "Erba Gold",
            category: "men",
            notes: { head: "Zitrus", heart: "Melone", base: "Vanille" },
            bestseller: true
        },
        {
            id: "L123",
            name: "No. L123",
            inspiredBy: "Coco Vanille",
            category: "women",
            notes: { head: "Kokos", heart: "Weiße Blüten", base: "Vanille" },
            bestseller: true
        },
        {
            id: "G333",
            name: "No. G333",
            inspiredBy: "Cherry Oud",
            category: "men",
            notes: { head: "Kirsche", heart: "Rose", base: "Oud" },
            newArrival: true
        },
        {
            id: "G343",
            name: "No. G343",
            inspiredBy: "Bleu Exclusif",
            category: "men",
            notes: { head: "Sandelholz", heart: "Leder", base: "Labdanum" },
            newArrival: true
        },
        {
            id: "L203",
            name: "No. L203",
            inspiredBy: "Good Girl Blush",
            category: "women",
            notes: { head: "Bergamotte", heart: "Pfingstrose", base: "Vanille" },
            newArrival: true
        }
    ]);

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
        "Maison Alhambra", "Tiziana Terenzi", "Viktor & Rolf", "Viktor Rolf", "Victor Rolf",
        "Paco Rabanne", "Paco Rabbane", "Ard Al Zaafaran", "Ard Al Khaleej", "Al Jazeera Perfumes",
        "Al Jaezeera", "Michael Kors", "Milton Llyod", "Franco Ferre", "Marc Jacobs", "Nina Ricci",
        "Issey Miyake", "Issey Miake", "Jo Malone", "Jimmy Choo", "Elie Saab", "Estee Lauder",
        "Hugo Boss", "Tom Ford", "Louis Vuitton", "Jil Sander", "Ted Lapidus", "KayAli", "Khadlaj",
        "D´Hermés", "Hermés", "Hermès", "Hermes", "Guerlain", "Baccarat", "Bulgari", "Bvlgari",
        "Afnan", "Azzaro", "Aramis", "Bois 1920", "Cacharel", "Cartier", "Chanel", "Chopard", "Chloe",
        "Creed", "Davidoff", "Diesel", "Dior", "Diptyque", "DKNY", "Dunhill", "Eisenberg", "Ex Nihilo",
        "Escada", "Fendi", "Gisada", "Gisah", "Givenchy", "Gucci", "Initio", "Joop!", "Joop",
        "Hummer", "Kajal", "Kenzo", "Kilian", "Killian", "Lacoste", "Lancome", "Lancôme", "Lattafa",
        "Lattfa", "Le Labo", "Mancera", "Malizia Uomo", "Montale", "Montblanc", "Mugler", "Nasomatto",
        "Nautica", "Nikos", "Nishane", "Orlane", "Orto Parisi", "Paris Hilton", "Penhaligon", "Prada",
        "Rasai", "Rasasi", "Roja", "Rochas", "Sospiro", "Terenzi", "Thameen", "Trussardi", "Valentino",
        "Versace", "Vertus", "Widian", "Xerjoff", "Yves Rocher", "Zarko Perfume", "Casamorati",
        "Amouage", "Ajmal", "Atkinson", "Bond No 9", "Burberry", "Byredo", "Memo Paris",
        "Molecules", "MFK", "JPG", "Jpg", "T.F.", "YSL", "D&G", "BLV", "CH", "PR", "LB", "Lv",
        "Armani", "Boss", "Yves"
    ].sort((a, b) => b.length - a.length);

    function escapeRegExp(value) {
        return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function stripBrandName(name) {
        if (!name) return "";

        let cleaned = String(name).split(/\s+-\s+/).slice(-1)[0].trim();
        const separator = "[\\s\\-–—/:|·'’´]+";

        for (let pass = 0; pass < 4; pass += 1) {
            const beforePass = cleaned;

            for (const brand of PRODUCT_BRAND_ALIASES) {
                const escapedBrand = escapeRegExp(brand);
                const prefix = new RegExp(`^${escapedBrand}(?:${separator}|$)`, "i");
                const suffix = new RegExp(`(?:${separator}|^)${escapedBrand}$`, "i");
                const embedded = new RegExp(`(^|${separator})${escapedBrand}(?=${separator}|$)`, "i");

                if (prefix.test(cleaned)) {
                    cleaned = cleaned.replace(prefix, "").trim();
                } else if (suffix.test(cleaned)) {
                    cleaned = cleaned.replace(suffix, "").trim();
                } else if (embedded.test(cleaned)) {
                    cleaned = cleaned.replace(embedded, "$1").trim();
                }
            }

            cleaned = cleaned
                .replace(/^[\s\-–—/:|·'’´]+|[\s\-–—/:|·'’´]+$/g, "")
                .replace(/\s{2,}/g, " ")
                .trim();
            if (cleaned === beforePass) break;
        }

        return cleaned || "Duftkomposition";
    }

    function pad(value) {
        return String(Math.max(0, value)).padStart(2, "0");
    }

    function getCountdownEnd() {
        const defaultEnd = Date.now() + ((2 * 24 + 12) * 60 * 60 * 1000);

        try {
            const stored = Number(sessionStorage.getItem(COUNTDOWN_KEY));
            if (Number.isFinite(stored) && stored > Date.now()) return stored;
            sessionStorage.setItem(COUNTDOWN_KEY, String(defaultEnd));
        } catch (_error) {
            return defaultEnd;
        }

        return defaultEnd;
    }

    function initCountdown() {
        const root = document.querySelector("[data-summer-countdown]");
        if (!root) return;

        const fields = {
            days: root.querySelector("[data-countdown-days]"),
            hours: root.querySelector("[data-countdown-hours]"),
            minutes: root.querySelector("[data-countdown-minutes]"),
            seconds: root.querySelector("[data-countdown-seconds]")
        };
        const end = getCountdownEnd();

        const update = () => {
            const distance = Math.max(0, end - Date.now());
            const totalSeconds = Math.floor(distance / 1000);
            const days = Math.floor(totalSeconds / 86400);
            const hours = Math.floor((totalSeconds % 86400) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            if (fields.days) fields.days.textContent = pad(days);
            if (fields.hours) fields.hours.textContent = pad(hours);
            if (fields.minutes) fields.minutes.textContent = pad(minutes);
            if (fields.seconds) fields.seconds.textContent = pad(seconds);
        };

        update();
        window.setInterval(update, 1000);
    }

    function getToast() {
        let toast = document.querySelector("[data-summer-toast]");
        if (toast) return toast;

        toast = document.createElement("div");
        toast.className = "summer-bundle-toast";
        toast.dataset.summerToast = "";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        toast.innerHTML = `
            <strong>Dein Bundle ist im Warenkorb.</strong>
            <span>Du kannst deine Auswahl dort noch einmal prüfen.</span>
        `;
        document.body.appendChild(toast);
        return toast;
    }

    let toastTimer = 0;

    function showToast(title, message) {
        const toast = getToast();
        const titleNode = toast.querySelector("strong");
        const messageNode = toast.querySelector("span");

        if (titleNode && title) titleNode.textContent = title;
        if (messageNode && message) messageNode.textContent = message;

        window.clearTimeout(toastTimer);
        toast.classList.add("is-visible");
        toastTimer = window.setTimeout(() => {
            toast.classList.remove("is-visible");
        }, 4200);
    }

    function readSavedSelection() {
        try {
            const stored = JSON.parse(localStorage.getItem(BUNDLE_SELECTION_KEY) || "{}");
            return Array.isArray(stored.ids) ? stored.ids.slice(0, REQUIRED_SCENTS) : [];
        } catch (_error) {
            return [];
        }
    }

    function addBundleToCart(selection, selectedProducts) {
        const selectedIds = selection.ids.map((id) => String(id || "").trim().toUpperCase());
        const sortedIds = [...selectedIds].sort();
        const cartId = `summerbundle-${selection.size}-${sortedIds.join("-")}`;
        let cart = [];

        try {
            const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
            if (Array.isArray(storedCart)) cart = storedCart;
        } catch (_error) {
            cart = [];
        }

        const existingItem = cart.find((item) => item?.cartId === cartId);
        if (existingItem) {
            existingItem.quantity = Math.max(1, Number(existingItem.quantity) || 1) + 1;
        } else {
            cart.push({
                cartId,
                id: `SUMMERBUNDLE-${selection.size}`,
                productId: "SUMMERBUNDLE",
                name: "NØTE. Sommerbundle · 3 Düfte",
                price: selection.displayPrice,
                originalPrice: selection.originalDisplayPrice,
                size: selection.size,
                quantity: 1,
                image: "images_website/sommerbundle/note-summerbundle-color-v4.webp",
                bundleSelections: selectedIds,
                bundleNames: selectedProducts.map((product) => `${product.code} ${product.displayName}`)
            });
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        window.dispatchEvent(new CustomEvent("note:cart-changed"));
        window.dispatchEvent(new CustomEvent("note:open-cart"));
    }

    function initInlineBundleBuilder() {
        const root = document.querySelector("[data-summer-inline-builder]");
        if (!root) return;

        const selects = Array.from(root.querySelectorAll("[data-summer-inline-select]"));
        const status = root.querySelector("[data-summer-inline-status]");
        const submitButton = root.querySelector("[data-summer-inline-submit]");
        const savedIds = readSavedSelection();

        selects.forEach((select, index) => {
            if (savedIds[index]) select.value = savedIds[index];
        });

        const getIds = () => selects.map((select) => select.value).filter(Boolean);

        const render = () => {
            const ids = getIds();
            const selectedIds = new Set(ids);
            const remaining = REQUIRED_SCENTS - ids.length;

            selects.forEach((select) => {
                Array.from(select.options).forEach((option) => {
                    option.disabled = Boolean(
                        option.value &&
                        option.value !== select.value &&
                        selectedIds.has(option.value)
                    );
                });
            });

            if (status) {
                status.textContent = remaining > 0
                    ? `Noch ${remaining} ${remaining === 1 ? "Duft" : "Düfte"} auswählen.`
                    : "Dein orientalisches Sommer-Trio ist vollständig.";
            }

            if (submitButton) {
                submitButton.disabled = remaining !== 0;
                submitButton.textContent = remaining > 0
                    ? `Noch ${remaining} ${remaining === 1 ? "Duft" : "Düfte"} wählen`
                    : "Trio im Bundle öffnen";
            }
        };

        selects.forEach((select) => select.addEventListener("change", render));

        submitButton?.addEventListener("click", () => {
            const ids = getIds();
            if (ids.length !== REQUIRED_SCENTS || new Set(ids).size !== REQUIRED_SCENTS) return;

            const names = selects.map((select) => {
                const option = select.options[select.selectedIndex];
                return option?.dataset.name || option?.textContent?.trim() || select.value;
            });
            const selection = {
                ids,
                names,
                size: 50,
                displayPrice: 99,
                originalDisplayPrice: 134.97,
                savedAt: new Date().toISOString(),
                campaign: "sommerbundle-2026"
            };

            try {
                localStorage.setItem(BUNDLE_SELECTION_KEY, JSON.stringify(selection));
            } catch (_error) {
                // Die Bundle-Seite öffnet auch ohne Browser-Speicher.
            }

            window.location.href = "sommerbundle.html";
        });

        render();
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function normalizeText(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function getProductNotes(product) {
        const notes = product?.notes && typeof product.notes === "object"
            ? Object.values(product.notes)
            : [];
        return notes
            .flatMap((note) => String(note || "").split(","))
            .map((note) => note.trim())
            .filter(Boolean)
            .slice(0, 5)
            .join(" · ");
    }

    function getFallbackBottleImage(category) {
        return category === "women"
            ? "images_parfume/parfume_women.png"
            : "images_parfume/parfume_men.png";
    }

    function normalizeProduct(product) {
        const id = String(product?.id || "").trim().toUpperCase();
        const category = String(product?.category || "").toLowerCase();
        const image = PRODUCT_FIRST_IMAGE_BY_ID[id]
            || (Array.isArray(product?.images) ? product.images.find(Boolean) : "")
            || getFallbackBottleImage(category);
        const code = String(product?.name || `No. ${id}`).trim();
        const rawDisplayName = String(product?.inspiredBy || product?.title || code).trim();
        const displayName = `…${stripBrandName(rawDisplayName)}®`;
        const notes = getProductNotes(product);

        return {
            id,
            code,
            displayName,
            category,
            notes,
            image: String(image || getFallbackBottleImage(category)).replace(/^\/+/, ""),
            bestseller: product?.bestseller === true,
            newArrival: product?.newArrival === true,
            searchText: normalizeText([
                id,
                code,
                rawDisplayName,
                displayName,
                notes,
                product?.description,
                category === "women" ? "damen frau" : "herren mann"
            ].join(" "))
        };
    }

    function readCachedProducts() {
        try {
            const cached = JSON.parse(sessionStorage.getItem("note_products_v2") || "[]");
            return Array.isArray(cached) && cached.length ? cached : null;
        } catch (_error) {
            return null;
        }
    }

    async function fetchProducts(url, timeoutMs = 9000) {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, { signal: controller.signal, credentials: "omit" });
            if (!response.ok) throw new Error(`Produkt-API antwortet mit ${response.status}`);
            const products = await response.json();
            if (!Array.isArray(products) || !products.length) throw new Error("Leerer Produktkatalog");
            return products;
        } finally {
            window.clearTimeout(timeout);
        }
    }

    async function loadBundleProducts() {
        const cached = readCachedProducts();
        if (cached) return cached;

        const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
        const endpoints = isLocal
            ? ["http://localhost:4242/api/products", REMOTE_PRODUCTS_URL]
            : ["/api/products", REMOTE_PRODUCTS_URL];

        for (const endpoint of endpoints) {
            try {
                const products = await fetchProducts(endpoint);
                try {
                    sessionStorage.setItem("note_products_v2", JSON.stringify(products));
                } catch (_error) {
                    // Der Katalog funktioniert auch ohne Browser-Cache.
                }
                return products;
            } catch (_error) {
                // Den nächsten sicheren Endpunkt versuchen.
            }
        }

        return FALLBACK_PRODUCTS;
    }

    function initBundleBuilder() {
        const slotsRoot = document.querySelector("[data-summer-slots]");
        if (!slotsRoot) return;

        const slots = Array.from(slotsRoot.querySelectorAll("[data-summer-slot]"));
        const countNode = document.querySelector("[data-summer-count]");
        const progressNode = document.querySelector("[data-summer-progress]");
        const summaryNode = document.querySelector("[data-summer-summary]");
        const submitButton = document.querySelector("[data-summer-submit]");
        const drawer = document.querySelector("[data-summer-drawer]");
        const backdrop = document.querySelector("[data-summer-drawer-backdrop]");
        const closeButton = document.querySelector("[data-summer-drawer-close]");
        const drawerSlots = document.querySelector("[data-summer-drawer-slots]");
        const productsRoot = document.querySelector("[data-summer-products]");
        const searchInput = document.querySelector("[data-summer-search]");
        const filterButtons = Array.from(document.querySelectorAll("[data-summer-filter]"));
        const resultCount = document.querySelector("[data-summer-result-count]");
        const pagination = document.querySelector("[data-summer-pagination]");
        const currentPageNode = document.querySelector("[data-summer-page-current]");
        const totalPagesNode = document.querySelector("[data-summer-page-total]");
        const previousPageButton = document.querySelector("[data-summer-page-prev]");
        const nextPageButton = document.querySelector("[data-summer-page-next]");
        const sizeButtons = Array.from(document.querySelectorAll("[data-summer-size]"));
        const sizeCopyNodes = Array.from(document.querySelectorAll("[data-summer-size-copy]"));
        const bundleSizeNodes = Array.from(document.querySelectorAll("[data-summer-bundle-size]"));
        const priceNodes = Array.from(document.querySelectorAll("[data-summer-price]"));
        const originalPriceNodes = Array.from(document.querySelectorAll("[data-summer-original-price]"));
        const savingNodes = Array.from(document.querySelectorAll("[data-summer-saving]"));
        const savedIds = readSavedSelection();
        const selectedProducts = Array(REQUIRED_SCENTS).fill(null);
        let catalog = FALLBACK_PRODUCTS.map(normalizeProduct);
        let catalogById = new Map(catalog.map((product) => [product.id, product]));
        let activeSlotIndex = 0;
        let activeFilter = "all";
        let currentPage = 0;
        let lastFocusedElement = null;
        let isFallbackCatalog = true;
        let currentSize = 50;

        const emptyBottleMarkup = `
            <span class="summer-empty-bottle" aria-hidden="true">
                <img src="images_website/branding/note-bottle-outline-note-antique-gold-transparent-v4.png" alt="">
            </span>
        `;

        const getSelected = () => selectedProducts.filter(Boolean);
        const getFirstEmptySlot = () => selectedProducts.findIndex((product) => !product);
        const formatPrice = (value) => `${value.toLocaleString("de-DE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} €`;

        const renderSize = () => {
            const option = SIZE_OPTIONS[currentSize];
            if (!option) return;

            sizeButtons.forEach((button) => {
                const isActive = Number(button.dataset.summerSize) === currentSize;
                button.classList.toggle("is-active", isActive);
                button.setAttribute("aria-pressed", String(isActive));
            });
            sizeCopyNodes.forEach((node) => {
                node.textContent = `${option.size} ml`;
            });
            bundleSizeNodes.forEach((node) => {
                node.textContent = `3 × ${option.size} ml`;
            });
            priceNodes.forEach((node) => {
                node.textContent = formatPrice(option.displayPrice);
            });
            originalPriceNodes.forEach((node) => {
                node.textContent = formatPrice(option.originalDisplayPrice);
            });
            savingNodes.forEach((node) => {
                node.textContent = formatPrice(option.saving);
            });
        };

        const renderProgress = () => {
            const selected = getSelected();
            const remaining = REQUIRED_SCENTS - selected.length;

            if (countNode) countNode.textContent = String(selected.length);
            if (progressNode) {
                progressNode.style.width = `${Math.min(100, (selected.length / REQUIRED_SCENTS) * 100)}%`;
                progressNode.parentElement?.setAttribute("data-progress-level", String(selected.length));
            }
            if (summaryNode) {
                summaryNode.textContent = selected.length
                    ? `Ausgewählt: ${selected.map((product) => `${product.code} ${product.displayName}`).join(", ")}`
                    : "Noch keinen Duft ausgewählt.";
            }
            if (submitButton) {
                submitButton.disabled = remaining !== 0;
                submitButton.textContent = remaining > 0
                    ? `Noch ${remaining} ${remaining === 1 ? "Duft" : "Düfte"} wählen`
                    : "Bundle in den Warenkorb legen";
            }
        };

        const renderSlots = () => {
            slots.forEach((slot, index) => {
                const product = selectedProducts[index];
                slot.classList.toggle("is-filled", Boolean(product));

                if (!product) {
                    slot.innerHTML = `
                        <button class="summer-slot-open" type="button" data-slot-open="${index}"
                            aria-label="Duft ${index + 1} auswählen">
                            ${emptyBottleMarkup}
                            <span class="summer-slot-plus" aria-hidden="true">+</span>
                        </button>
                    `;
                } else {
                    slot.innerHTML = `
                        <button class="summer-slot-open" type="button" data-slot-open="${index}"
                            aria-label="${escapeHtml(product.code)} ${escapeHtml(product.displayName)} ändern">
                            <img class="summer-slot-product-image" src="${escapeHtml(product.image)}"
                                alt="${escapeHtml(product.code)} ${escapeHtml(product.displayName)}" loading="lazy">
                            <span class="summer-slot-product-code">${escapeHtml(product.code)}</span>
                            <strong class="summer-slot-product-name">${escapeHtml(product.displayName)}</strong>
                            <span class="summer-slot-change">Ändern</span>
                        </button>
                        <button class="summer-slot-remove" type="button" data-slot-remove="${index}"
                            aria-label="${escapeHtml(product.code)} aus dem Bundle entfernen">×</button>
                    `;
                }
            });

            slotsRoot.querySelectorAll("[data-slot-open]").forEach((button) => {
                button.addEventListener("click", () => openDrawer(Number(button.dataset.slotOpen)));
            });
            slotsRoot.querySelectorAll("[data-slot-remove]").forEach((button) => {
                button.addEventListener("click", () => {
                    selectedProducts[Number(button.dataset.slotRemove)] = null;
                    renderAll();
                });
            });

            renderProgress();
        };

        const renderDrawerSlots = () => {
            if (!drawerSlots) return;

            drawerSlots.innerHTML = selectedProducts.map((product, index) => `
                <button class="summer-drawer-slot${index === activeSlotIndex ? " is-active" : ""}"
                    type="button" data-drawer-slot="${index}"
                    aria-label="Bundle-Platz ${index + 1}${product ? `: ${escapeHtml(product.displayName)}` : ": frei"}">
                    ${product
                        ? `<img src="${escapeHtml(product.image)}" alt="" loading="lazy">`
                        : `<span class="summer-drawer-slot-index" aria-hidden="true">${index + 1}</span>`}
                    <span>
                        <b>${product ? escapeHtml(product.displayName) : `Platz ${index + 1}`}</b>
                        <span>${product ? "Ändern" : "Frei"}</span>
                    </span>
                </button>
            `).join("");

            drawerSlots.querySelectorAll("[data-drawer-slot]").forEach((button) => {
                button.addEventListener("click", () => {
                    activeSlotIndex = Number(button.dataset.drawerSlot);
                    renderDrawerSlots();
                    renderProductList();
                });
            });
        };

        const productMatchesFilter = (product) => {
            if (activeFilter === "men") return product.category === "men";
            if (activeFilter === "women") return product.category === "women";
            if (activeFilter === "bestseller") return product.bestseller;
            if (activeFilter === "new") return product.newArrival;
            return true;
        };

        const renderProductList = () => {
            if (!productsRoot) return;

            const query = normalizeText(searchInput?.value);
            const matches = catalog.filter((product) => (
                productMatchesFilter(product) &&
                (!query || product.searchText.includes(query))
            ));
            const totalPages = Math.max(1, Math.ceil(matches.length / PRODUCTS_PER_PAGE));
            currentPage = Math.min(currentPage, totalPages - 1);
            const pageStart = currentPage * PRODUCTS_PER_PAGE;
            const pageEnd = Math.min(pageStart + PRODUCTS_PER_PAGE, matches.length);
            const visibleProducts = matches.slice(pageStart, pageEnd);
            const selectedIds = new Set(
                selectedProducts
                    .map((product, index) => index === activeSlotIndex ? null : product?.id)
                    .filter(Boolean)
            );

            if (resultCount) {
                resultCount.textContent = isFallbackCatalog
                    ? `${matches.length} Düfte in der Auswahl`
                    : matches.length
                        ? `${pageStart + 1}–${pageEnd} von ${matches.length} Düften`
                        : "0 Düfte";
            }
            if (pagination) pagination.hidden = false;
            if (currentPageNode) currentPageNode.textContent = String(currentPage + 1);
            if (totalPagesNode) totalPagesNode.textContent = String(totalPages);
            if (previousPageButton) previousPageButton.disabled = currentPage === 0;
            if (nextPageButton) nextPageButton.disabled = currentPage >= totalPages - 1 || !matches.length;

            if (!matches.length) {
                productsRoot.innerHTML = `
                    <div class="summer-drawer-empty">
                        <p>Kein Duft passt zu deiner Suche.<br>Probiere eine andere Nummer, Duftnote oder Kategorie.</p>
                    </div>
                `;
                return;
            }

            productsRoot.innerHTML = visibleProducts.map((product) => {
                const alreadySelected = selectedIds.has(product.id);
                return `
                    <button class="summer-drawer-product" type="button" data-product-id="${escapeHtml(product.id)}"
                        ${alreadySelected ? "disabled" : ""}
                        aria-label="${escapeHtml(product.code)} ${escapeHtml(product.displayName)} auswählen">
                        <img src="${escapeHtml(product.image)}"
                            alt="${escapeHtml(product.code)} ${escapeHtml(product.displayName)}" loading="lazy">
                        <span class="summer-drawer-product-copy">
                            <small>${escapeHtml(product.code)}</small>
                            <strong>${escapeHtml(product.displayName)}</strong>
                            <span>${escapeHtml(product.notes || (product.category === "women" ? "Damenduft" : "Herrenduft"))}</span>
                        </span>
                    </button>
                `;
            }).join("");

            productsRoot.querySelectorAll("[data-product-id]").forEach((button) => {
                button.addEventListener("click", () => {
                    const product = catalogById.get(String(button.dataset.productId));
                    if (!product) return;
                    selectedProducts[activeSlotIndex] = product;
                    renderAll();
                    closeDrawer();
                });
            });
        };

        const renderAll = () => {
            renderSlots();
            renderDrawerSlots();
            if (drawer && !drawer.hidden) renderProductList();
        };

        function openDrawer(index) {
            if (!drawer || !backdrop) return;
            activeSlotIndex = Number.isInteger(index) ? index : Math.max(0, getFirstEmptySlot());
            lastFocusedElement = document.activeElement;
            drawer.hidden = false;
            backdrop.hidden = false;
            drawer.setAttribute("aria-hidden", "false");
            document.body.classList.add("summer-drawer-open");
            activeFilter = "all";
            currentPage = 0;
            if (searchInput) searchInput.value = "";
            filterButtons.forEach((button) => {
                button.classList.toggle("is-active", button.dataset.summerFilter === "all");
            });
            renderDrawerSlots();
            renderProductList();
            window.setTimeout(() => searchInput?.focus(), 0);
        }

        function closeDrawer() {
            if (!drawer || !backdrop || drawer.hidden) return;
            drawer.hidden = true;
            backdrop.hidden = true;
            drawer.setAttribute("aria-hidden", "true");
            document.body.classList.remove("summer-drawer-open");
            if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
        }

        closeButton?.addEventListener("click", closeDrawer);
        backdrop?.addEventListener("click", closeDrawer);
        filterButtons.forEach((button) => {
            button.addEventListener("click", () => {
                activeFilter = String(button.dataset.summerFilter || "all");
                currentPage = 0;
                filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
                renderProductList();
            });
        });
        searchInput?.addEventListener("input", () => {
            currentPage = 0;
            renderProductList();
        });

        const changePage = (direction) => {
            currentPage += direction;
            renderProductList();
            if (drawer && productsRoot) {
                drawer.scrollTo({
                    top: Math.max(0, productsRoot.offsetTop - 118),
                    behavior: "smooth"
                });
            }
        };

        previousPageButton?.addEventListener("click", () => {
            if (currentPage > 0) changePage(-1);
        });
        nextPageButton?.addEventListener("click", () => {
            changePage(1);
        });
        sizeButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const nextSize = Number(button.dataset.summerSize);
                if (!SIZE_OPTIONS[nextSize]) return;
                currentSize = nextSize;
                renderSize();
            });
        });

        document.addEventListener("keydown", (event) => {
            if (!drawer || drawer.hidden) return;
            if (event.key === "Escape") {
                event.preventDefault();
                closeDrawer();
                return;
            }
            if (event.key !== "Tab") return;

            const focusable = Array.from(
                drawer.querySelectorAll('button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')
            ).filter((element) => !element.hasAttribute("hidden"));
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        });

        submitButton?.addEventListener("click", () => {
            const selected = getSelected();
            if (selected.length !== REQUIRED_SCENTS) return;
            const selectedSize = SIZE_OPTIONS[currentSize];

            const selection = {
                ids: selected.map((product) => product.id),
                names: selected.map((product) => `${product.code} · ${product.displayName}`),
                size: selectedSize.size,
                displayPrice: selectedSize.displayPrice,
                originalDisplayPrice: selectedSize.originalDisplayPrice,
                savedAt: new Date().toISOString(),
                campaign: "sommerbundle-2026"
            };

            try {
                localStorage.setItem(BUNDLE_SELECTION_KEY, JSON.stringify(selection));
            } catch (_error) {
                // Der Warenkorb funktioniert auch ohne gespeicherte Vorauswahl.
            }

            addBundleToCart(selection, selected);
            showToast(
                "Dein Sommerbundle ist im Warenkorb.",
                `Drei Düfte à ${selectedSize.size} ml wurden hinzugefügt.`
            );
        });

        renderSize();
        renderAll();

        loadBundleProducts().then((products) => {
            catalog = products
                .map(normalizeProduct)
                .filter((product) => product.id && product.displayName);
            catalogById = new Map(catalog.map((product) => [product.id, product]));
            isFallbackCatalog = products === FALLBACK_PRODUCTS || catalog.length <= FALLBACK_PRODUCTS.length;

            savedIds.forEach((id, index) => {
                const product = catalogById.get(String(id).toUpperCase());
                if (product) selectedProducts[index] = product;
            });

            renderAll();
        });
    }

    initCountdown();
    initInlineBundleBuilder();
    initBundleBuilder();
})();
