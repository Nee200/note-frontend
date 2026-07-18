document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('[data-new-arrivals-track]');
    const previousButton = document.querySelector('[data-new-arrivals-prev]');
    const nextButton = document.querySelector('[data-new-arrivals-next]');

    if (!track || !previousButton || !nextButton) return;

    const cardStep = () => {
        const card = track.querySelector('.new-drop-card');
        if (!card) return track.clientWidth * 0.8;

        const styles = window.getComputedStyle(track);
        const gap = Number.parseFloat(styles.columnGap || styles.gap || '0');
        return card.getBoundingClientRect().width + gap;
    };

    const move = direction => {
        track.scrollBy({
            left: direction * cardStep(),
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
        });
    };

    previousButton.addEventListener('click', () => move(-1));
    nextButton.addEventListener('click', () => move(1));

    const updateArrowState = () => {
        const hasOverflow = track.scrollWidth > track.clientWidth + 4;
        previousButton.disabled = !hasOverflow || track.scrollLeft <= 4;
        nextButton.disabled = !hasOverflow || track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
    };

    let scrollFrame = 0;
    track.addEventListener('scroll', () => {
        cancelAnimationFrame(scrollFrame);
        scrollFrame = requestAnimationFrame(updateArrowState);
    }, { passive: true });

    window.addEventListener('resize', updateArrowState, { passive: true });
    requestAnimationFrame(updateArrowState);

    const closeVariantPickers = except => {
        track.querySelectorAll('.new-drop-variant-picker:not([hidden])').forEach(picker => {
            if (picker === except) return;
            picker.hidden = true;
            picker.closest('.new-drop-card')?.querySelector('[data-new-arrival-cart]')?.setAttribute('aria-expanded', 'false');
        });
    };

    track.addEventListener('click', event => {
        const cartButton = event.target.closest('[data-new-arrival-cart]');
        if (cartButton) {
            event.preventDefault();
            event.stopPropagation();

            const picker = cartButton.closest('.new-drop-card')?.querySelector('.new-drop-variant-picker');
            if (!picker) return;
            const shouldOpen = picker.hidden;
            closeVariantPickers();
            picker.hidden = !shouldOpen;
            cartButton.setAttribute('aria-expanded', String(shouldOpen));
            if (shouldOpen) picker.querySelector('[data-add-variant]')?.focus();
            return;
        }

        const variantButton = event.target.closest('[data-add-variant]');
        if (!variantButton) return;

        event.preventDefault();
        event.stopPropagation();

        const card = variantButton.closest('.new-drop-card');
        const button = card?.querySelector('[data-new-arrival-cart]');
        const productId = button?.dataset.productId || '';
        if (!button || !productId) return;

        const size = variantButton.dataset.size || '30';
        const price = Number(variantButton.dataset.price || 17.99);
        const originalPrice = Number(variantButton.dataset.originalPrice || 34.99);
        let cart = [];
        try {
            const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');
            if (Array.isArray(storedCart)) cart = storedCart;
        } catch (error) {
            cart = [];
        }

        const cartId = `${productId}-${size}`;
        const existingItem = cart.find(item => String(item.cartId || '') === cartId);
        if (existingItem) {
            existingItem.quantity = Number(existingItem.quantity || 0) + 1;
        } else {
            cart.push({
                cartId,
                id: cartId,
                productId,
                name: `${button.dataset.productName || productId} (${size}ml)`,
                price,
                originalPrice,
                size: Number(size),
                quantity: 1,
                image: button.dataset.productImage || 'logo.webp'
            });
        }

        if (typeof window.writeCart === 'function') {
            window.writeCart(cart);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
        }
        window.dispatchEvent(new CustomEvent('note:cart-updated'));

        closeVariantPickers();
        button.classList.add('is-added');
        window.setTimeout(() => button.classList.remove('is-added'), 900);
    });

    document.addEventListener('click', event => {
        if (!event.target.closest('.new-drop-info')) closeVariantPickers();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeVariantPickers();
    });
});
