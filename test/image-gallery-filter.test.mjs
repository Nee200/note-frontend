import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';

const source = await fs.readFile(new URL('../image-gallery.js', import.meta.url), 'utf8');
const pictures = ['6', '10', '14'].flatMap(size => ['closed', 'open', 'exploded'].map((state, index) => ({
    size, key: `${size}-${state}`, alt: `${size} ml ${state}`,
    src: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="${['#eee0c2', '#d4b574', '#aa8844'][index]}"/><text x="10" y="100">${size} ${state}</text></svg>`)
})));

async function fixture(t, delayed = false) {
    const browser = await puppeteer.launch({ headless: true, ...(process.platform === 'win32' ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : {}), args: process.platform === 'linux' ? ['--no-sandbox'] : [] });
    t.after(() => browser.close());
    const page = await browser.newPage(), errors = [];
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    page.on('pageerror', error => errors.push(error.message));
    await page.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>
        body{margin:20px} .gallery-thumb{display:inline-block;width:48px;height:48px} .gallery-thumb img{width:100%;height:100%}
        #autoduft-main-image,#image-lightbox-image{display:block;width:200px;height:200px;touch-action:pan-y pinch-zoom}
        #image-lightbox{position:fixed;inset:0;display:grid;place-content:center;background:#fff} #image-lightbox[hidden]{display:none}
        button{min-width:36px;min-height:36px}
        </style></head><body>
        <div class="gallery-thumbnails">${pictures.map(picture => `<button class="gallery-thumb" data-key="${picture.key}" data-gallery-size="${picture.size}" data-gallery-src="${picture.src}" data-gallery-alt="${picture.alt}"><img src="${picture.src}" alt=""></button>`).join('')}</div>
        <img id="autoduft-main-image" src="${pictures[0].src}" alt="initial">
        <button data-gallery-step="-1">Previous</button><button data-gallery-step="1">Next</button><span id="gallery-counter"></span>
        <button id="open-image-lightbox">Enlarge</button>
        <div id="image-lightbox" hidden><div class="image-lightbox-dialog"><button id="close-image-lightbox">Close</button><img id="image-lightbox-image" alt=""><button data-lightbox-step="-1">Previous</button><button data-lightbox-step="1">Next</button><span id="lightbox-counter"></span></div></div>
        </body></html>`);
    if (delayed) await page.evaluate(() => {
        window.pendingImages = new Map();
        window.Image = class {
            decode() {
                return new Promise((resolve, reject) => {
                    const requests = window.pendingImages.get(this.src) || [];
                    requests.push({ resolve, reject });
                    window.pendingImages.set(this.src, requests);
                });
            }
        };
        window.finishImage = (key, fail = false) => {
            const src = document.querySelector(`[data-key="${key}"]`).dataset.gallerySrc;
            const requests = window.pendingImages.get(src) || [];
            window.pendingImages.delete(src);
            requests.forEach(request => fail ? request.reject(new Error('Synthetic decode failure')) : request.resolve());
        };
    });
    await page.addScriptTag({ content: source });
    await page.evaluate(() => {
        window.galleryLocks = new Set();
        window.gallery = window.NoteImageGallery({
            lock: owner => galleryLocks.add(owner), unlock: owner => galleryLocks.delete(owner), tapToOpen: true,
            initialFilter: thumbnail => thumbnail.dataset.gallerySize === '6'
        });
    });
    return { page, errors };
}

async function state(page) {
    return page.evaluate(() => ({
        visible: [...document.querySelectorAll('[data-gallery-src]')].filter(button => getComputedStyle(button).display !== 'none').map(button => button.dataset.key),
        active: [...document.querySelectorAll('[aria-current="true"]')].map(button => button.dataset.key),
        alt: document.querySelector('#autoduft-main-image').alt,
        counter: document.querySelector('#gallery-counter').textContent,
        enlarged: document.querySelector('#image-lightbox-image').alt,
        enlargedCounter: document.querySelector('#lightbox-counter').textContent
    }));
}

async function waitForPicture(page, alt) {
    await page.waitForFunction(expected => document.querySelector('#autoduft-main-image').alt === expected, {}, alt);
}

async function swipe(page, selector) {
    const rect = await page.$eval(selector, image => { const r = image.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
    const session = await page.createCDPSession();
    try {
        const x = rect.x + rect.width * .8, y = rect.y + rect.height / 2;
        await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        for (let step = 1; step <= 6; step++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - rect.width * .6 * step / 6, y }] });
        await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } finally { await session.detach(); }
}

test('filtered galleries keep thumbnails, arrow keys, swipe, wheel and lightbox in the selected size', { timeout: 30000 }, async t => {
    const { page, errors } = await fixture(t);
    assert.deepEqual((await state(page)).visible, ['6-closed', '6-open', '6-exploded']);
    assert.equal((await state(page)).counter, '1 / 3');
    await page.click('[data-gallery-step="-1"]');
    await waitForPicture(page, '6 ml exploded');
    assert.equal((await state(page)).counter, '3 / 3');
    // A hidden thumbnail must not bypass the filter even when clicked by a script.
    await page.$eval('[data-key="14-open"]', button => button.click());
    assert.equal((await state(page)).alt, '6 ml exploded');
    await swipe(page, '#autoduft-main-image');
    await waitForPicture(page, '6 ml closed');
    await page.click('#open-image-lightbox');
    await page.keyboard.press('ArrowLeft');
    await waitForPicture(page, '6 ml exploded');
    assert.equal((await state(page)).enlargedCounter, '3 / 3');
    await page.evaluate(() => gallery.setFilter(thumbnail => thumbnail.dataset.gallerySize === '14'));
    assert.equal((await state(page)).enlarged, '14 ml closed');
    assert.deepEqual((await state(page)).visible, ['14-closed', '14-open', '14-exploded']);
    await page.click('[data-lightbox-step="1"]');
    await waitForPicture(page, '14 ml open');
    await swipe(page, '#image-lightbox-image');
    await waitForPicture(page, '14 ml exploded');
    await page.$eval('#image-lightbox-image', image => image.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, cancelable: true })));
    await waitForPicture(page, '14 ml closed');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => galleryLocks.size), 0);
    await page.evaluate(() => gallery.setFilter(thumbnail => thumbnail.dataset.key === '10-closed'));
    assert.equal((await state(page)).counter, '1 / 1');
    assert.equal(await page.$$eval('[data-gallery-step],[data-lightbox-step]', buttons => buttons.every(button => button.disabled)), true);
    await page.click('#open-image-lightbox');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'close-image-lightbox');
    await page.evaluate(() => gallery.setFilter(() => false));
    assert.equal((await state(page)).counter, '0 / 0');
    assert.equal(await page.evaluate(() => document.querySelector('#image-lightbox').hidden && document.querySelector('#autoduft-main-image').hidden && galleryLocks.size === 0), true);
    await page.evaluate(() => gallery.setFilter());
    assert.equal((await state(page)).counter, '1 / 9');
    assert.equal((await state(page)).visible.length, 9);
    assert.deepEqual(errors, []);
});

test('a size change invalidates late decodes and failed navigation can be retried', { timeout: 30000 }, async t => {
    const { page, errors } = await fixture(t, true);
    await page.evaluate(() => {
        document.querySelector('[data-key="6-open"]').click();
        gallery.setFilter(thumbnail => thumbnail.dataset.gallerySize === '10');
        document.querySelector('[data-key="10-exploded"]').click();
        gallery.setFilter(thumbnail => thumbnail.dataset.gallerySize === '14');
        finishImage('10-exploded');
        finishImage('6-open');
    });
    assert.deepEqual((await state(page)).active, ['14-closed']);
    assert.equal((await state(page)).counter, '1 / 3');
    await page.click('#open-image-lightbox');
    await page.evaluate(() => {
        document.querySelector('[data-lightbox-step="1"]').click();
        document.querySelector('[data-lightbox-step="1"]').click();
        finishImage('14-exploded');
    });
    await waitForPicture(page, '14 ml exploded');
    await page.evaluate(() => finishImage('14-open'));
    assert.equal((await state(page)).counter, '3 / 3');
    assert.equal((await state(page)).enlarged, '14 ml exploded');
    await page.evaluate(() => {
        gallery.setFilter(thumbnail => thumbnail.dataset.gallerySize === '10');
        document.querySelector('[data-lightbox-step="1"]').click();
        finishImage('10-open', true);
    });
    assert.equal((await state(page)).alt, '10 ml closed');
    await page.click('[data-lightbox-step="1"]');
    await page.evaluate(() => finishImage('10-open'));
    await waitForPicture(page, '10 ml open');
    assert.equal((await state(page)).enlargedCounter, '2 / 3');
    assert.deepEqual(errors, []);
});
