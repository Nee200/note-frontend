'use strict';
window.NotePerfumeGallery = function (images, name) {
    const mainImage = document.getElementById('detail-main-image');
    if (!mainImage || mainImage.dataset.galleryReady) return;
    mainImage.dataset.galleryReady = 'true';
    const thumbnails = document.getElementById('detail-thumbnails');
    thumbnails.setAttribute('aria-label', 'Produktbilder');
    const fragment = document.createDocumentFragment();
    const explodedSource = window.NoteAssets?.image('images_website/product-details/note-perfume-exploded-v5.webp') || 'images_website/product-details/note-perfume-exploded-v5.webp';
    images.forEach((source, index) => {
        const mappedSource = window.NoteAssets?.image(source) || source;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'detail-thumbnail';
        button.dataset.gallerySrc = source;
        button.dataset.galleryAlt = mappedSource === explodedSource
            ? 'NØTE. Parfümflakon – Explosionsansicht mit Ornamentkappe, Zerstäuber und Glasflakon'
            : `${name || 'NØTE. Parfüm'} – Ansicht ${index + 1}`;
        button.setAttribute('aria-label', `Produktbild ${index + 1} anzeigen`);
        const image = document.createElement('img');
        image.src = mappedSource;
        image.alt = '';
        image.decoding = 'async';
        button.append(image);
        fragment.append(button);
    });
    thumbnails.replaceChildren(fragment);
    let scrollState;
    window.NoteImageGallery({
        mainImage,
        tapToOpen: true,
        lock() {
            scrollState = { top: window.scrollY, position: document.body.style.position, inset: document.body.style.top, width: document.body.style.width };
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollState.top}px`;
            document.body.style.width = '100%';
        },
        unlock() {
            if (!scrollState) return;
            document.body.style.position = scrollState.position;
            document.body.style.top = scrollState.inset;
            document.body.style.width = scrollState.width;
            window.scrollTo({ top: scrollState.top, behavior: 'instant' });
            scrollState = null;
        }
    });
};

