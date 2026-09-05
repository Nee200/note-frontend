'use strict';
window.NoteImageGallery = function ({ lock, unlock, mainImage = document.getElementById('autoduft-main-image'), tapToOpen = false }) {
    const thumbnails = [...document.querySelectorAll('[data-gallery-src]')];
    const lightbox = document.getElementById('image-lightbox');
    const enlargedImage = document.getElementById('image-lightbox-image');
    const openButton = document.getElementById('open-image-lightbox');
    const closeButton = document.getElementById('close-image-lightbox');
    const counters = [document.getElementById('gallery-counter'), document.getElementById('lightbox-counter')];
    const pictures = thumbnails.map(button => ({ src: window.NoteAssets?.image(button.dataset.gallerySrc) || button.dataset.gallerySrc, alt: button.dataset.galleryAlt }));
    if (!mainImage || !pictures.length) return;
    const decoded = new Map();
    let requestedIndex = 0, displayedIndex = 0, requestVersion = 0, suppressClickUntil = 0;

    function preload(index) {
        if (!decoded.has(index)) {
            const image = new Image();
            image.decoding = 'async';
            image.src = pictures[index].src;
            const ready = image.decode().then(() => image).catch(error => { decoded.delete(index); throw error; });
            decoded.set(index, ready);
        }
        return decoded.get(index);
    }

    function render(index) {
        const picture = pictures[index];
        mainImage.src = picture.src;
        mainImage.alt = picture.alt;
        if (!lightbox.hidden) { enlargedImage.src = picture.src; enlargedImage.alt = picture.alt; }
        thumbnails.forEach((button, i) => {
            button.classList.toggle('is-active', i === index);
            button.classList.toggle('active', i === index);
            button.setAttribute('aria-current', String(i === index));
        });
        counters.forEach(counter => { counter.textContent = `${index + 1} / ${pictures.length}`; });
        displayedIndex = index;
    }

    async function show(index) {
        requestedIndex = (index + pictures.length) % pictures.length;
        const next = requestedIndex, version = ++requestVersion;
        try {
            // Keep the current decoded image visible until its replacement is ready.
            await preload(next);
            if (version === requestVersion) render(next);
        } catch {
            if (version === requestVersion) requestedIndex = displayedIndex;
        }
    }

    thumbnails.forEach((button, index) => button.addEventListener('click', () => show(index)));
    document.querySelectorAll('[data-gallery-step], [data-lightbox-step]').forEach(button => {
        button.addEventListener('click', () => show(requestedIndex + Number(button.dataset.galleryStep || button.dataset.lightboxStep)));
    });

    function open() {
        if (!lightbox.hidden) return;
        lightbox.hidden = false;
        render(displayedIndex);
        lock('gallery');
        requestAnimationFrame(() => { if (!lightbox.hidden) lightbox.classList.add('is-visible'); });
        closeButton.focus({ preventScroll: true });
    }

    function close() {
        if (lightbox.hidden) return;
        lightbox.hidden = true;
        lightbox.classList.remove('is-visible');
        unlock('gallery');
        openButton.focus({ preventScroll: true });
    }

    openButton.addEventListener('click', open);
    closeButton.addEventListener('click', close);
    const isBackdrop = target => target === lightbox || target.classList.contains('image-lightbox-dialog');
    function consumeReleaseClick() {
        // Touch browsers can synthesize a click after pointerup, when the overlay
        // is already hidden. Keep that release from activating the page beneath.
        const cleanup = () => {
            document.removeEventListener('click', consume, true);
            document.removeEventListener('pointerdown', cleanup, true);
            clearTimeout(timer);
        };
        const consume = event => {
            event.preventDefault();
            event.stopImmediatePropagation();
            cleanup();
        };
        const timer = setTimeout(cleanup, 700);
        document.addEventListener('click', consume, true);
        // A new press is a separate, intentional interaction.
        document.addEventListener('pointerdown', cleanup, true);
    }
    let backdropPress;
    lightbox.addEventListener('pointerdown', event => {
        backdropPress = event.isPrimary && isBackdrop(event.target) ? { id: event.pointerId, x: event.clientX, y: event.clientY } : null;
    });
    lightbox.addEventListener('pointerup', event => {
        const start = backdropPress;
        backdropPress = null;
        if (start && start.id === event.pointerId && isBackdrop(event.target) && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 12) {
            event.preventDefault();
            consumeReleaseClick();
            close();
        }
    });
    lightbox.addEventListener('pointercancel', () => { backdropPress = null; });
    lightbox.addEventListener('click', event => {
        if (Date.now() < suppressClickUntil) return;
        if (isBackdrop(event.target)) close();
    });
    document.addEventListener('keydown', event => {
        if (lightbox.hidden) return;
        if (event.key === 'Escape') { event.preventDefault(); close(); }
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault(); show(requestedIndex + (event.key === 'ArrowLeft' ? -1 : 1));
        } else if (event.key === 'Tab') {
            const buttons = [...lightbox.querySelectorAll('button')];
            const index = buttons.indexOf(document.activeElement);
            const next = (index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
            event.preventDefault(); buttons[next].focus();
        }
    });

    function enableSwipe(surface) {
        let gesture;
        surface.addEventListener('dragstart', event => event.preventDefault());
        surface.addEventListener('pointerdown', event => {
            if (!event.isPrimary || event.button !== 0 || event.target.closest('button')) return;
            gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
            surface.setPointerCapture(event.pointerId);
        });
        surface.addEventListener('pointerup', event => {
            if (!gesture || event.pointerId !== gesture.id) return;
            const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
            gesture = null;
            if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
                suppressClickUntil = Date.now() + 350;
                show(requestedIndex + (dx < 0 ? 1 : -1));
            }
        });
        surface.addEventListener('pointercancel', () => { gesture = null; });
        surface.addEventListener('lostpointercapture', () => { gesture = null; });
    }
    if (tapToOpen) {
        mainImage.tabIndex = 0;
        mainImage.setAttribute('role', 'button');
        mainImage.setAttribute('aria-haspopup', 'dialog');
        mainImage.setAttribute('aria-label', 'Produktbild vergrößern');
        mainImage.addEventListener('click', () => { if (Date.now() >= suppressClickUntil) open(); });
        mainImage.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
        });
        // The page continues to scroll normally; the wheel navigates only inside the enlarged image.
        let lastWheel = 0;
        enlargedImage.addEventListener('wheel', event => {
            if (event.ctrlKey) return;
            event.preventDefault();
            const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
            if (Math.abs(delta) < 10 || Date.now() - lastWheel < 300) return;
            lastWheel = Date.now();
            show(requestedIndex + (delta > 0 ? 1 : -1));
        }, { passive: false });
    }
    render(0);
    mainImage.draggable = false;
    enableSwipe(mainImage);
    enableSwipe(enlargedImage);
    // Decode optimized image URLs before switching, and share this behavior across product pages.
    pictures.forEach((_, index) => { preload(index).catch(() => {}); });
};
