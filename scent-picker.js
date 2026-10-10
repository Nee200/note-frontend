/* Shared scent selection dialog for configurable products. */
window.NoteScentPicker = function ({ lock, unlock, onSelect, loadProducts }) {
    const modal = document.getElementById('scent-modal');
    const trigger = document.getElementById('open-selector');
    const closeButton = document.getElementById('close-modal');
    const search = document.getElementById('scent-search');
    const grid = document.getElementById('scent-grid');
    const count = document.getElementById('result-count');
    const tabs = [...modal.querySelectorAll('[data-category]')];
    const normalize = value => String(value || '').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
    let scents = [], loaded = false, loading = false, failed = false, category = 'all', selectedId = '';
    const imageSource = product => {
        const source = product.images?.[0] || 'images_parfume/parfume_mann_webp.webp';
        try { const url = new URL(source, location.href); return url.origin === location.origin ? (window.NoteAssets?.image(source) || source) : 'logo.webp'; }
        catch { return 'logo.webp'; }
    };
    function render() {
        grid.setAttribute('aria-labelledby', `scent-tab-${category}`);
        grid.scrollTop = 0;
        grid.replaceChildren();
        grid.setAttribute('aria-busy', String(loading));
        if (!loaded) {
            count.textContent = loading ? 'Düfte werden geladen …' : 'Duftauswahl';
            const message = document.createElement('div'); message.className = 'empty-state';
            message.textContent = failed ? 'Die Düfte konnten nicht geladen werden.' : 'Düfte werden geladen …';
            if (failed) { const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = 'Erneut laden'; retry.addEventListener('click', load); message.append(retry); }
            grid.append(message); return;
        }
        const query = normalize(search.value);
        const filtered = scents.filter(scent => (category === 'all' || category === scent.category) && scent.search.some(value => value.includes(query)));
        count.textContent = `${filtered.length} ${filtered.length === 1 ? 'Duft' : 'Düfte'}`;
        if (!filtered.length) { const empty = document.createElement('div'); empty.className = 'empty-state'; empty.textContent = 'Kein Duft passt zu deiner Suche.'; grid.append(empty); return; }
        const fragment = document.createDocumentFragment();
        filtered.forEach((scent, index) => {
            const card = document.createElement('button'); card.type = 'button'; card.className = 'scent-card'; card.dataset.scentId = scent.id;
            card.classList.toggle('is-selected', scent.id === selectedId);
            card.style.setProperty('--card-index', Math.min(index, 8));
            card.setAttribute('aria-label', `${scent.id} ${scent.name} auswählen`);
            card.innerHTML = '<span class="selected-mark" aria-hidden="true">✓</span><img alt="" loading="lazy" decoding="async" width="200" height="200"><span class="scent-code"></span><strong class="scent-name"></strong><span class="scent-desc"></span>';
            card.querySelector('img').src = scent.image;
            card.querySelector('.scent-code').textContent = `NØTE. ${scent.id}`;
            card.querySelector('.scent-name').textContent = scent.name;
            card.querySelector('.scent-desc').textContent = scent.description;
            card.addEventListener('click', () => { selectedId = scent.id; onSelect(scent); close(); });
            fragment.append(card);
        });
        grid.append(fragment);
    }
    async function load() {
        if (loading || loaded) return scents;
        loading = true; failed = false; render();
        try {
            const products = await loadProducts();
            scents = products.filter(p => /^[GL]\d{1,4}$/.test(String(p.id)) && ['men', 'women'].includes(p.category)).map(p => ({
                id: p.id, category: p.category, name: String(p.publicName || p.name || p.id), description: String(p.description || ''), image: imageSource(p),
                search: [p.id, p.name, p.publicName, p.inspiredBy, p.description, p.longDescription, ...Object.values(p.notes || {})].map(normalize)
            })).sort((a,b) => a.id.localeCompare(b.id, 'de', {numeric:true}));
            loaded = true;
        } catch { failed = true; }
        finally { loading = false; render(); }
        return scents;
    }
    function viewport() {
        modal.style.setProperty('--scent-viewport-height', `${window.visualViewport?.height || innerHeight}px`);
        modal.style.setProperty('--scent-viewport-top', `${window.visualViewport?.offsetTop || 0}px`);
    }
    function open() {
        if (!modal.hidden) return;
        modal.hidden = false; lock('scent'); viewport(); render(); load();
        window.addEventListener('resize', viewport);
        window.visualViewport?.addEventListener('resize', viewport);
        window.visualViewport?.addEventListener('scroll', viewport);
        requestAnimationFrame(() => { if (!modal.hidden) modal.classList.add('is-visible'); });
        const focus = matchMedia('(max-width:620px), (pointer:coarse)').matches ? closeButton : search;
        focus.focus({preventScroll:true});
    }
    function close() {
        if (modal.hidden) return;
        search.blur(); modal.hidden = true; modal.classList.remove('is-visible');
        window.removeEventListener('resize', viewport);
        window.visualViewport?.removeEventListener('resize', viewport);
        window.visualViewport?.removeEventListener('scroll', viewport);
        unlock('scent'); trigger.focus({preventScroll:true});
    }
    tabs.forEach((tab,index) => {
        tab.tabIndex = index === 0 ? 0 : -1;
        tab.addEventListener('click', () => { category = tab.dataset.category; tabs.forEach(item => { const active = item === tab; item.classList.toggle('is-active', active); item.setAttribute('aria-selected', String(active)); item.tabIndex = active ? 0 : -1; }); render(); });
        tab.addEventListener('keydown', event => { let next; if (event.key === 'ArrowRight') next = (index+1)%tabs.length; if (event.key === 'ArrowLeft') next = (index+tabs.length-1)%tabs.length; if(event.key === 'Home') next = 0; if(event.key === 'End') next = tabs.length-1; if(next !== undefined){event.preventDefault();tabs[next].click();tabs[next].focus();} });
    });
    search.addEventListener('input', render);
    trigger.addEventListener('click', open); closeButton.addEventListener('click', close);
    modal.addEventListener('click', event => { if (event.target === modal) close(); });
    modal.addEventListener('keydown', event => { if(event.key === 'Escape'){event.preventDefault();close();} });
    return {open, load, select(id) { selectedId = id; return scents.find(scent => scent.id === id); }};
};
