import { test } from 'node:test';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { preview } from '../scripts/preview.mjs';

const product = {
    id: 'G1', name: 'G1', publicName: 'Testduft', category: 'men', description: 'Ein frischer Testduft.',
    longDescription: 'Beschreibung des Testdufts.', notes: { head: 'Bergamotte', heart: 'Lavendel', base: 'Moschus' },
    images: ['images_website/new-arrivals/g1-notes-v3-natural-v1.webp', 'logo.webp'],
    variants: { 30: { price: 34.99 }, 50: { price: 44.99 } }, reviewSummary: { average: 0, count: 0 }
};

async function swipe(page, selector) {
    const { x, y, width, height } = await page.$eval(selector, image => { const r = image.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
    const session = await page.createCDPSession();
    try {
        await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x + width * .8, y: y + height / 2 }] });
        for (let step = 1; step <= 6; step++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + width * (.8 - step * .1), y: y + height / 2 }] });
        await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } finally { await session.detach(); }
}

test('Perfume layout preserves purchases and supports enlarged touch, keyboard, wheel and backdrop navigation', { timeout: 90000 }, async () => {
    const server = await preview(0);
    const browser = await puppeteer.launch({ headless: true, ...(process.platform === 'win32' ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : {}), args: process.platform === 'linux' ? ['--no-sandbox'] : [] });
    try {
        for (const mobile of [true, false]) {
            const page = await browser.newPage(), errors = [];
            await page.setViewport({ width: mobile ? 390 : 1366, height: mobile ? 844 : 900, hasTouch: mobile, isMobile: mobile });
            await page.evaluateOnNewDocument(() => {
                localStorage.setItem('cookie_consent', 'necessary');
                localStorage.setItem('cart', '[]');
            });
            page.on('pageerror', error => errors.push(error.message));
            await page.setRequestInterception(true);
            page.on('request', request => {
                const url = new URL(request.url());
                if (url.pathname.startsWith('/api/')) {
                    const body = url.pathname === '/api/products' ? [product] : url.pathname.endsWith('/reviews') ? { reviews: [], summary: { average: 0, count: 0 } } : {};
                    return request.respond({ status: url.pathname === '/api/user' ? 401 : 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': `http://127.0.0.1:${server.address().port}`, 'Access-Control-Allow-Credentials': 'true' }, body: JSON.stringify(body) });
                }
                if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return request.abort();
                return request.continue();
            });
            await page.goto(`http://127.0.0.1:${server.address().port}/product.html?id=G1`, { waitUntil: 'load' });
            await page.waitForFunction(() => document.querySelector('#detail-main-image').naturalWidth > 0);
            assert.equal(await page.$eval('.detail-info', element => getComputedStyle(element).textAlign), 'center');
            assert.equal(await page.$$eval('.benefits-list .icon-anim i', icons => icons.length), 3);
            assert.equal(await page.$$eval('.detail-thumbnail', items => items.length), 3);
            assert.equal(await page.$$eval('.product-accordions .accordion-subtitle', items => items.length), 0);
            await page.click('[aria-controls="accordion-notes"]');
            assert.equal(await page.$eval('[aria-controls="accordion-notes"]', item => item.getAttribute('aria-expanded')), 'true');
            await page.click('[aria-controls="accordion-notes"]');
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
            assert.equal(await page.evaluate(mobile => {
                const info = document.querySelector('.detail-info').getBoundingClientRect(), details = document.querySelector('.product-accordions').getBoundingClientRect();
                return mobile ? details.top >= info.bottom : details.right < info.left;
            }, mobile), true);

            await page.$eval('#detail-main-image', element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
            if (mobile) await swipe(page, '#detail-main-image');
            else await page.click('[data-gallery-step="1"]');
            await page.waitForFunction(() => document.querySelector('#gallery-counter').textContent === '2 / 3');
            assert.equal(await page.$eval('#detail-main-image', element => element.alt.includes('Explosionsansicht')), true);
            // A swipe must not also open the enlarged view.
            assert.equal(await page.$eval('#image-lightbox', element => element.hidden), true);
            await page.click('#open-image-lightbox');
            await page.waitForSelector('#image-lightbox.is-visible');
            if (mobile) await swipe(page, '#image-lightbox-image');
            else await page.click('[data-lightbox-step="1"]');
            await page.waitForFunction(() => document.querySelector('#lightbox-counter').textContent === '3 / 3');
            assert.equal(await page.$eval('#image-lightbox', element => element.hidden), false);
            if (!mobile) {
                await page.hover('#image-lightbox-image');
                await page.mouse.wheel({ deltaY: 100 });
                await page.waitForFunction(() => document.querySelector('#lightbox-counter').textContent === '1 / 3');
                await page.keyboard.press('ArrowLeft');
                await page.waitForFunction(() => document.querySelector('#lightbox-counter').textContent === '3 / 3');
                await page.keyboard.press('Tab');
                assert.equal(await page.evaluate(() => document.querySelector('#image-lightbox').contains(document.activeElement)), true);
            }
            // The blank margin beside the image closes the view and restores scrolling.
            await page.waitForFunction(() => getComputedStyle(document.querySelector('#image-lightbox')).opacity === '1');
            if (mobile) await page.touchscreen.tap(5, 5); else await page.mouse.click(5, 5);
            await page.waitForFunction(() => document.querySelector('#image-lightbox').hidden);
            assert.equal(await page.evaluate(() => document.body.style.position), '');
            await page.click('#open-image-lightbox');
            await page.keyboard.press('Escape');
            assert.equal(await page.$eval('#image-lightbox', element => element.hidden), true);
            // Tapping or keyboard-activating the image opens the view too.
            await page.$eval('#detail-main-image', element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
            await page.focus('#detail-main-image');
            await page.keyboard.press('Enter');
            await page.waitForSelector('#image-lightbox.is-visible');
            await page.click('#close-image-lightbox');

            await page.click('.option-btn:first-child');
            assert.match(await page.$eval('#detail-price', element => element.textContent), /34[,.]99/);
            await page.click('#detail-add-btn');
            await page.waitForFunction(() => window.NoteCart.read().some(item => item.cartId === 'G1-30'));
            const cart = await page.evaluate(() => window.NoteCart.read().find(item => item.cartId === 'G1-30'));
            assert.equal(cart.price, 34.99);
            assert.equal(cart.quantity, 1);
            assert.deepEqual(errors, []);
            await page.close();
        }
    } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});

test('Review pagination is absent on an empty or single page and navigates multiple pages', { timeout: 60000 }, async () => {
    const server = await preview(0);
    const browser = await puppeteer.launch({ headless: true, ...(process.platform === 'win32' ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : {}), args: process.platform === 'linux' ? ['--no-sandbox'] : [] });
    try {
        const page = await browser.newPage();
        let mode = 'empty';
        await page.evaluateOnNewDocument(() => localStorage.setItem('cookie_consent', 'necessary'));
        await page.setRequestInterception(true);
        page.on('request', request => {
            const url = new URL(request.url());
            if (url.pathname.startsWith('/api/')) {
                const number = Number(url.searchParams.get('page') || 1);
                const reviews = mode === 'empty' ? [] : [{ rating: 5, authorName: `Seite ${number}`, title: 'Testbewertung', comment: 'Synthetische Bewertung', createdAt: '2026-01-01' }];
                const body = url.pathname === '/api/products' ? [product] : url.pathname.endsWith('/reviews') ? { reviews, summary: { average: reviews.length ? 5 : 0, count: reviews.length }, hasMore: mode === 'multiple' && number === 1 } : {};
                return request.respond({ status: url.pathname === '/api/user' ? 401 : 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': `http://127.0.0.1:${server.address().port}`, 'Access-Control-Allow-Credentials': 'true' }, body: JSON.stringify(body) });
            }
            if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return request.abort();
            return request.continue();
        });
        await page.goto(`http://127.0.0.1:${server.address().port}/product.html?id=G1`, { waitUntil: 'networkidle0' });
        assert.equal(await page.$('#reviews-pagination'), null);
        mode = 'single';
        await page.evaluate(() => loadProductReviews('G1'));
        assert.equal(await page.$$eval('.review-item', items => items.length), 1);
        assert.equal(await page.$('#reviews-pagination'), null);
        mode = 'multiple';
        await page.evaluate(() => loadProductReviews('G1'));
        assert.equal(await page.$eval('#reviews-pagination button:first-child', button => button.disabled), true);
        await page.click('#reviews-pagination button:last-child');
        await page.waitForFunction(() => document.querySelector('.review-item-author')?.textContent === 'Seite 2');
        assert.equal(await page.$eval('#reviews-pagination button:last-child', button => button.disabled), true);
        await page.click('#reviews-pagination button:first-child');
        await page.waitForFunction(() => document.querySelector('.review-item-author')?.textContent === 'Seite 1');
    } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
