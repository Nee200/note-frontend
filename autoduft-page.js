(function () {
const API_BASE_URL = window.NoteApi.base;
        const AUTODUFT_PRODUCT_ID = 'AUTODUFT';
        const AUTODUFT_PRICE = 19.99;
        const AUTODUFT_IMAGE = 'images_website/autoduft/note-autoduft-wood-core-product-v1.png';

        const scents = [
            {
                id: 'G351',
                name: 'Orange in Full Bloom',
                category: 'men',
                description: 'Strahlende Zitrusfrische, helle Blüten und weiches Holz.',
                image: 'images_website/new-arrivals/g351-notes-5pct-v1.webp'
            },
            {
                id: 'L214',
                name: 'Garden by the Nile',
                category: 'women',
                description: 'Grüne Mango, Lotus und elegante Hölzer.',
                image: 'images_website/new-arrivals/l214-notes-5pct-v1.webp'
            },
            {
                id: 'G333',
                name: 'Royal Cherry',
                category: 'men',
                description: 'Dunkel, fruchtig und holzig mit ausdrucksstarker Tiefe.',
                image: 'images_website/new-arrivals/g333-notes-5pct-v1.webp'
            },
            {
                id: 'L212',
                name: 'Pure Musk Embrace',
                category: 'women',
                description: 'Weicher Moschus, weiße Blüten und cremiges Holz.',
                image: 'images_website/new-arrivals/l212-notes-5pct-v1.webp'
            },
            {
                id: 'G343',
                name: 'Blue After Dark Exclusive',
                category: 'men',
                description: 'Dicht, amber-aromatisch und markant holzig.',
                image: 'images_website/new-arrivals/g343-notes-5pct-v1.webp'
            },
            {
                id: 'L203',
                name: 'Blush After Midnight',
                category: 'women',
                description: 'Floral, vanillig und pudrig-elegant.',
                image: 'images_website/new-arrivals/l203-notes-5pct-v1.webp'
            },
            {
                id: 'G352',
                name: 'Leather Across the Savannah',
                category: 'men',
                description: 'Warmer Lederduft mit Kardamom, Rose und dunkler Tiefe.',
                image: 'images_website/new-arrivals/g352-notes-5pct-v1.webp'
            },
            {
                id: 'L62',
                name: 'Whispers of Devotion',
                category: 'women',
                description: 'Feminin, weich und elegant mit warmer Signatur.',
                image: 'images_website/bestsellers/l62-comparison-transparent-v2.webp'
            }
        ];

        let pageScrollState = null;
        const scrollOwners = new Set();

        function lockPageScroll(owner = 'scent') {
            scrollOwners.add(owner);
            if (pageScrollState) return;

            pageScrollState = {
                x: window.scrollX,
                y: window.scrollY,
                htmlOverflow: document.documentElement.style.overflow,
                bodyOverflow: document.body.style.overflow,
                bodyPosition: document.body.style.position,
                bodyTop: document.body.style.top,
                bodyLeft: document.body.style.left,
                bodyRight: document.body.style.right,
                bodyWidth: document.body.style.width
            };

            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${pageScrollState.y}px`;
            document.body.style.left = `-${pageScrollState.x}px`;
            document.body.style.right = '0';
            document.body.style.width = '100%';
        }

        function unlockPageScroll(owner = 'scent') {
            scrollOwners.delete(owner);
            if (scrollOwners.size) return;
            if (!pageScrollState) return;

            const previousState = pageScrollState;
            pageScrollState = null;
            document.documentElement.style.overflow = previousState.htmlOverflow;
            document.body.style.overflow = previousState.bodyOverflow;
            document.body.style.position = previousState.bodyPosition;
            document.body.style.top = previousState.bodyTop;
            document.body.style.left = previousState.bodyLeft;
            document.body.style.right = previousState.bodyRight;
            document.body.style.width = previousState.bodyWidth;
            window.scrollTo({ left: previousState.x, top: previousState.y, behavior: 'instant' });
        }

        function initDeliveryTimeline() {
            const orderedEl = document.getElementById('delivery-ordered-date');
            const shippedEl = document.getElementById('delivery-shipped-range');
            const deliveredEl = document.getElementById('delivery-delivered-range');
            const timeline = document.querySelector('.autoduft-trust-badges .delivery-timeline');

            if (!orderedEl || !shippedEl || !deliveredEl || !timeline) return;

            const today = new Date();
            const addDays = (baseDate, days) => {
                const date = new Date(baseDate);
                date.setDate(date.getDate() + days);
                return date;
            };
            const formatDayMonth = (date) => `${date.getDate()}. ${date.toLocaleString('de-DE', { month: 'long' })}`;

            orderedEl.textContent = 'Heute';
            shippedEl.textContent = `${formatDayMonth(addDays(today, 1))} – ${formatDayMonth(addDays(today, 3))}`;
            deliveredEl.textContent = `${formatDayMonth(addDays(today, 3))} – ${formatDayMonth(addDays(today, 5))}`;

            window.requestAnimationFrame(() => timeline.classList.add('delivery-timeline-visible'));
        }

        initDeliveryTimeline();

        function initProductAccordions() {
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

            document.querySelectorAll('.accordions details').forEach((detail) => {
                const summary = detail.querySelector('summary');
                const content = detail.querySelector('.accordion-content');
                if (!summary || !content) return;

                summary.addEventListener('click', (event) => {
                    event.preventDefault();
                    if (detail.dataset.animating === 'true') return;

                    const opening = !detail.open;
                    if (reducedMotion.matches) {
                        detail.open = opening;
                        return;
                    }

                    detail.dataset.animating = 'true';
                    detail.classList.toggle('is-closing', !opening);
                    if (opening) {
                        detail.open = true;
                        const expandedHeight = content.scrollHeight;
                        content.style.height = '0px';
                        content.style.opacity = '0';
                        content.style.transform = 'translateY(-7px)';
                        content.getBoundingClientRect();
                        window.requestAnimationFrame(() => {
                            content.style.height = `${expandedHeight}px`;
                            content.style.opacity = '1';
                            content.style.transform = 'translateY(0)';
                        });
                    } else {
                        content.style.height = `${content.getBoundingClientRect().height}px`;
                        content.style.opacity = '1';
                        content.style.transform = 'translateY(0)';
                        content.getBoundingClientRect();
                        window.requestAnimationFrame(() => {
                            content.style.height = '0px';
                            content.style.opacity = '0';
                            content.style.transform = 'translateY(-7px)';
                        });
                    }

                    window.setTimeout(() => {
                        if (!opening) detail.open = false;
                        content.style.height = '';
                        content.style.opacity = '';
                        content.style.transform = '';
                        detail.classList.remove('is-closing');
                        delete detail.dataset.animating;
                    }, opening ? 380 : 320);
                });
            });
        }

        initProductAccordions();

        const modal = document.getElementById('scent-modal');
        const openSelector = document.getElementById('open-selector');
        const closeModalButton = document.getElementById('close-modal');
        const searchInput = document.getElementById('scent-search');
        const scentGrid = document.getElementById('scent-grid');
        const resultCount = document.getElementById('result-count');
        const selectedMini = document.getElementById('selected-mini');
        const selectedScentTitle = document.getElementById('selected-scent-title');
        const selectedScentDescription = document.getElementById('selected-scent-description');
        const addButton = document.getElementById('add-btn');
        const toast = document.getElementById('toast');

        let activeCategory = 'all';
        let selectedScent = null;
        let toastTimer = null;

        const normalize = (value) => String(value || '')
            .toLocaleLowerCase('de-DE')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        function renderScents() {
            const query = normalize(searchInput.value);
            const filtered = scents.filter((scent) => {
                const inCategory = activeCategory === 'all' || scent.category === activeCategory;
                const haystack = normalize(`${scent.id} ${scent.name} ${scent.description}`);
                return inCategory && haystack.includes(query);
            });

            resultCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'Duft' : 'Düfte'}`;

            if (!filtered.length) {
                scentGrid.innerHTML = '<div class="empty-state">Kein Duft passt zu deiner Suche.</div>';
                return;
            }

            scentGrid.innerHTML = filtered.map((scent, index) => `
                <button class="scent-card${selectedScent && selectedScent.id === scent.id ? ' is-selected' : ''}"
                    type="button" data-scent-id="${scent.id}" style="--card-index: ${index}" aria-label="Duftnote ${scent.id} ${scent.name} auswählen">
                    <span class="selected-mark" aria-hidden="true">✓</span>
                    <img src="${scent.image}" alt="" loading="lazy">
                    <span class="scent-code">${scent.id} Duftnote</span>
                    <strong class="scent-name">${scent.name}</strong>
                    <span class="scent-desc">${scent.description}</span>
                </button>
            `).join('');

            scentGrid.querySelectorAll('[data-scent-id]').forEach((card) => {
                card.addEventListener('click', () => selectScent(card.dataset.scentId));
            });
        }

        function openModal() {
            modal.hidden = false;
            lockPageScroll();
            renderScents();
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => modal.classList.add('is-visible'));
            });
            window.setTimeout(() => searchInput.focus(), 150);
        }

        let selectorOpening = false;

        function animateSelectorOpen() {
            if (selectorOpening) return;

            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                openModal();
                return;
            }

            selectorOpening = true;
            openSelector.classList.add('is-opening');
            openSelector.setAttribute('aria-busy', 'true');

            window.setTimeout(() => {
                openSelector.classList.remove('is-opening');
                openSelector.removeAttribute('aria-busy');
                selectorOpening = false;
                openModal();
            }, 80);
        }

        function closeModal() {
            modal.classList.remove('is-visible');
            window.setTimeout(() => {
                modal.hidden = true;
                openSelector.focus({ preventScroll: true });
                unlockPageScroll();
            }, 150);
        }

        function selectScent(id) {
            selectedScent = scents.find((scent) => scent.id === id) || null;
            if (!selectedScent) return;

            selectedMini.src = selectedScent.image;
            selectedMini.alt = '';
            selectedScentTitle.textContent = `${selectedScent.id} Duftnote`;
            selectedScentDescription.textContent = selectedScent.name;
            openSelector.classList.add('has-selection');
            document.getElementById('konfigurator').classList.add('has-selection');
            addButton.textContent = 'Autoduft in den Warenkorb · 19,99 €';
            closeModal();
            showToast(`${selectedScent.id} wurde als Duftnote für deinen Autoduft gewählt.`);
        }

        function showToast(message) {
            toast.textContent = message;
            toast.classList.add('is-visible');
            window.clearTimeout(toastTimer);
            toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
        }

        function readCart() {
            try {
                const stored = window.NoteCart.read();
                return Array.isArray(stored)
                    ? stored.filter((item) => item && Number(item.quantity) > 0)
                    : [];
            } catch (error) {
                return [];
            }
        }

        function writeCart(items) { window.NoteCart.write(items); }

        function addConfiguredAutoduftToCart() {
            if (!selectedScent) return null;

            const items = readCart();
            const cartId = `${AUTODUFT_PRODUCT_ID}-${selectedScent.id}`;
            let item = items.find((entry) => String(entry.cartId || '') === cartId);

            if (item) {
                if (Number(item.quantity) >= 20) { showToast('Maximal 20 Stück je Duftfüllung.'); return null; }
                item.quantity = Math.max(1, Number(item.quantity) || 1) + 1;
            } else {
                item = {
                    cartId,
                    id: cartId,
                    productId: AUTODUFT_PRODUCT_ID,
                    productType: 'autoduft',
                    name: 'NØTE. Autoduft',
                    scentId: selectedScent.id,
                    scentName: selectedScent.name,
                    size: 'Duftfüllung',
                    price: AUTODUFT_PRICE,
                    originalPrice: null,
                    quantity: 1,
                    image: AUTODUFT_IMAGE
                };
                items.push(item);
            }

            writeCart(items);
            return item;
        }

        const getCsrfToken = () => window.NoteApi.csrf();

        openSelector.addEventListener('click', animateSelectorOpen);
        closeModalButton.addEventListener('click', closeModal);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeModal();
        });

        document.querySelectorAll('[data-category]').forEach((tab) => {
            tab.addEventListener('click', () => {
                activeCategory = tab.dataset.category;
                document.querySelectorAll('[data-category]').forEach((item) => {
                    const isActive = item === tab;
                    item.classList.toggle('is-active', isActive);
                    item.setAttribute('aria-selected', String(isActive));
                });
                renderScents();
            });
        });

        searchInput.addEventListener('input', renderScents);

        addButton.addEventListener('click', () => {
            if (selectedScent) {
                if (addConfiguredAutoduftToCart()) window.dispatchEvent(new CustomEvent('note:cart-updated'));
            }
            else animateSelectorOpen();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !modal.hidden) closeModal();
        });

        document.getElementById('newsletter-form')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const input = form.querySelector('input[type="email"]');
            const button = form.querySelector('button[type="submit"]');
            const status = document.getElementById('newsletter-status');
            const email = String(input?.value || '').trim();
            if (!email || !input.checkValidity()) {
                input?.reportValidity();
                return;
            }
            button.disabled = true;
            status.textContent = 'Anmeldung wird gesendet …';
            try {
                const csrfToken = await getCsrfToken();
                const response = await window.NoteApi.fetch(`${API_BASE_URL}/api/newsletter`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
                    body: JSON.stringify({ email })
                });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(payload.error || 'Anmeldung fehlgeschlagen.');
                status.textContent = payload.message || 'Bitte bestätige deine Anmeldung per E-Mail.';
                form.reset();
            } catch (error) {
                status.textContent = error.message || 'Anmeldung fehlgeschlagen.';
            } finally {
                button.disabled = false;
            }
        });

        document.getElementById('cookie-settings')?.addEventListener('click', (event) => {
            event.preventDefault();
            window.NOTE_openCookieResetDialog?.();
        });



        renderScents();
window.NoteAutoduftGallery({ lock: lockPageScroll, unlock: unlockPageScroll });
})();
