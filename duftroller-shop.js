(function () {
    'use strict';

    const recommendationIds = ['G333', 'G343', 'L203', 'L62'];
    const recommendationImages = Object.freeze({
        G333: 'images_website/bestsellers/g333-comparison-v1.webp',
        G343: 'images_website/bestsellers/g343-comparison-v1.webp',
        L203: 'images_website/bestsellers/l203-comparison-v1.webp',
        L62: 'images_website/bestsellers/l62-comparison-transparent-v2.webp'
    });
    const currency = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
    const berlinDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });

    // Calculate calendar dates in the shop's timezone, independently of the visitor's timezone or DST.
    function todayInBerlin() {
        const parts = Object.fromEntries(berlinDate.formatToParts(new Date()).map(part => [part.type, part.value]));
        return new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), 12));
    }

    function addWorkingDays(start, count) {
        const date = new Date(start);
        while (count > 0) {
            date.setUTCDate(date.getUTCDate() + 1);
            if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6) count -= 1;
        }
        return date;
    }

    function dateLabel(date, today) {
        return date.toLocaleDateString('de-DE', {
            timeZone: 'UTC', day: 'numeric', month: 'short',
            ...(date.getUTCFullYear() !== today.getUTCFullYear() ? { year: 'numeric' } : {})
        });
    }

    function makeElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function dateElement(date, today) {
        const element = makeElement('time', '', dateLabel(date, today));
        element.dateTime = date.toISOString().slice(0, 10);
        return element;
    }

    function updateTimeline() {
        const ordered = document.getElementById('roller-delivery-ordered');
        const shipped = document.getElementById('roller-delivery-shipped');
        const delivered = document.getElementById('roller-delivery-delivered');
        if (!ordered || !shipped || !delivered) return;
        const today = todayInBerlin();
        const firstDay = addWorkingDays(today, 1);
        const lastDay = addWorkingDays(today, 3);
        ordered.textContent = 'Heute';
        ordered.dateTime = today.toISOString().slice(0, 10);
        shipped.replaceChildren(dateElement(firstDay, today));
        delivered.replaceChildren(dateElement(firstDay, today), document.createTextNode(' – '), dateElement(lastDay, today));
    }

    function productImage(product) {
        const source = recommendationImages[product.id];
        if (!source) return '';
        try {
            const mapped = window.NoteAssets?.image(source) || source;
            const url = new URL(mapped, location.href);
            if (url.origin === location.origin && /^https?:$/.test(url.protocol)) return url.href;
        } catch { /* Fall back to the known local product photograph. */ }
        return source;
    }

    function usableProduct(product) {
        if (!product || !recommendationIds.includes(product.id) || !['men', 'women'].includes(product.category)) return null;
        const name = typeof product.publicName === 'string' && product.publicName.trim()
            ? product.publicName.trim() : typeof product.name === 'string' ? product.name.trim() : '';
        if (!name) return null;
        const variants = ['30', '50'].flatMap(size => {
            const price = product.variants?.[size]?.price;
            if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return [];
            const cents = Math.round(price * 100);
            if (!Number.isSafeInteger(cents) || cents < 1) return [];
            return [{ size: Number(size), cents }];
        }).sort((a, b) => a.cents - b.cents || a.size - b.size);
        return variants.length ? { product, name, variant: variants[0], hasChoice: variants.length > 1 } : null;
    }

    function productCard({ product, name, variant, hasChoice }) {
        const card = makeElement('a', 'roller-recommendation-card');
        card.href = `product.html?id=${encodeURIComponent(product.id)}`;
        card.setAttribute('aria-label', `NØTE. ${product.id} – ${name} ansehen`);
        card.dataset.productId = product.id;
        card.append(makeElement('span', 'roller-recommendation-code', `NØTE. ${product.id}`));

        const visual = makeElement('div', 'roller-recommendation-visual');
        const source = productImage(product);
        function missingImage() {
            visual.classList.add('is-unavailable');
            visual.replaceChildren(makeElement('span', '', 'Bild nicht verfügbar'));
        }
        if (source) {
            const image = makeElement('img');
            image.alt = `NØTE. ${product.id} – ${name}`;
            image.loading = 'lazy';
            image.decoding = 'async';
            image.width = 360;
            image.height = 360;
            image.addEventListener('error', missingImage, { once: true });
            image.src = source;
            visual.append(image);
        } else missingImage();
        card.append(visual, makeElement('h3', 'roller-recommendation-name', name));
        card.append(makeElement('p', 'roller-recommendation-price', `${hasChoice ? 'ab ' : ''}${currency.format(variant.cents / 100)}`));
        card.append(makeElement('p', 'roller-recommendation-unit', `${variant.size} ml · ${currency.format(variant.cents * 10 / variant.size)} / 1 l`));
        return card;
    }

    function initRecommendations() {
        const grid = document.getElementById('roller-recommendations-grid');
        const status = document.getElementById('roller-recommendations-status');
        const message = document.getElementById('roller-recommendations-message');
        const retry = document.getElementById('roller-recommendations-retry');
        const collection = document.getElementById('roller-recommendations-collection');
        const heading = document.getElementById('roller-recommendations-title');
        if (!grid || !status || !message || !retry || !collection || !heading) return;
        let loading = false;

        async function load() {
            if (loading) return;
            loading = true;
            grid.setAttribute('aria-busy', 'true');
            status.hidden = false;
            message.textContent = 'Unsere Empfehlungen werden geladen …';
            retry.setAttribute('aria-disabled', 'true');
            retry.textContent = 'Wird geladen …';
            try {
                if (typeof window.loadStorefrontProducts !== 'function') throw new Error('Catalog loader unavailable');
                const products = await window.loadStorefrontProducts();
                if (!Array.isArray(products)) throw new Error('Invalid catalog response');
                const cards = recommendationIds.map(id => usableProduct(products.find(product => product?.id === id)))
                    .filter(Boolean).map(productCard);
                if (!cards.length) throw new Error('No priced recommendations available');
                grid.replaceChildren(...cards);
                grid.hidden = false;
                // Keep keyboard focus on the page when a successful retry hides its button.
                if (document.activeElement === retry) cards[0].focus({ preventScroll: true });
                status.hidden = true;
                retry.hidden = true;
                collection.hidden = true;
            } catch {
                grid.replaceChildren();
                grid.hidden = true;
                message.textContent = 'Die Empfehlungen sind gerade nicht verfügbar.';
                retry.hidden = false;
                collection.hidden = false;
            } finally {
                grid.setAttribute('aria-busy', 'false');
                retry.removeAttribute('aria-disabled');
                retry.textContent = 'Erneut versuchen';
                loading = false;
            }
        }

        retry.addEventListener('click', load);
        load();
    }

    function init() {
        updateTimeline();
        initRecommendations();
        // Long-lived tabs should not continue advertising yesterday's dates.
        window.addEventListener('focus', updateTimeline);
        document.addEventListener('visibilitychange', () => { if (!document.hidden) updateTimeline(); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
