(() => {
    'use strict';
    const VARIANTS = Object.freeze({6:{price:12.50,cap:'Weißer Deckel'},10:{price:16,cap:'Schwarzer Deckel'},14:{price:19.50,cap:'Goldfarbener Deckel'}});
    const money = value => new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(value);
    const image = size => `images_website/duftroller/note-duftroller-${size}-closed-v1.webp`;
    const button = document.getElementById('add-btn'), status = document.getElementById('roller-selection-status');
    let size = '6', scent = null, catalog = null, available = false, failed = false, pending;
    let scrollState, toastTimer, gallery;
    let saved;
    try { saved = JSON.parse(window.NoteStore.session.getItem('note_duftroller_selection') || 'null'); } catch {}
    if (Object.hasOwn(VARIANTS, String(saved?.size))) size = String(saved.size);
    let pendingScentId = typeof saved?.scentId === 'string' ? saved.scentId : '';
    const locks = new Set(), inertState = new Map();
    function lock(owner) {
        locks.add(owner);
        if (scrollState) return;
        scrollState = {x:scrollX,y:scrollY,html:document.documentElement.style.overflow,body:document.body.getAttribute('style')};
        document.documentElement.style.overflow = 'hidden';
        Object.assign(document.body.style,{position:'fixed',top:`-${scrollState.y}px`,left:'0',right:'0',width:'100%',overflow:'hidden'});
        const active = document.getElementById(owner === 'scent' ? 'scent-modal' : 'image-lightbox');
        [...document.body.children].filter(node => node !== active && !['SCRIPT','STYLE'].includes(node.tagName)).forEach(node => { inertState.set(node,node.inert); node.inert = true; });
    }
    function unlock(owner) {
        locks.delete(owner); if(locks.size || !scrollState) return;
        const previous = scrollState; scrollState = null;
        document.documentElement.style.overflow = previous.html;
        if(previous.body === null) document.body.removeAttribute('style'); else document.body.setAttribute('style',previous.body);
        inertState.forEach((value,node) => node.inert = value); inertState.clear();
        scrollTo({left:previous.x,top:previous.y,behavior:'instant'});
    }
    document.addEventListener('keydown', event => {
        if(event.defaultPrevented || event.key !== 'Tab' || !locks.size) return;
        const dialog = document.getElementById(locks.has('scent')?'scent-modal':'image-lightbox');
        const controls = [...dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href],[tabindex="0"]')].filter(node => node.tabIndex >= 0 && node.getClientRects().length);
        const first = controls[0], last = controls.at(-1);
        if(event.shiftKey && document.activeElement === first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey && document.activeElement === last){event.preventDefault();first?.focus();}
    });
    function persist() { window.NoteStore.session.setItem('note_duftroller_selection',JSON.stringify({size,scentId:scent?.id || pendingScentId})); }
    function price() { const value = Number(catalog?.variants?.[size]?.price); return Number.isFinite(value) && value>0 ? value : VARIANTS[size].price; }
    function render() {
        const value = price();
        document.getElementById('roller-price').textContent = money(value);
        document.getElementById('roller-unit-price').textContent = `${money(value*1000/Number(size))} / l · ${size} ml`;
        document.getElementById('roller-gallery-size').textContent = `${size} ml`;
        const configImage = document.getElementById('roller-config-image');
        configImage.src = window.NoteAssets.image(image(size));
        configImage.alt = `Duftroller ${size} ml · ${VARIANTS[size].cap}`;
        document.getElementById('roller-config-description').textContent = `${size} ml · ${VARIANTS[size].cap}`;
        document.getElementById('konfigurator-roller').classList.toggle('has-selection', !!scent);
        document.querySelectorAll('[name="roller-size"]').forEach(input => { input.checked = input.value === size; });
        button.disabled = !available && !failed;
        button.textContent = available ? (scent ? `In den Warenkorb · ${money(value)}` : 'Duftfüllung auswählen') : failed ? 'Erneut laden' : 'Duftauswahl wird geladen …';
        status.textContent = failed ? 'Die Duftauswahl ist gerade nicht erreichbar. Bitte versuche es erneut.' : scent ? `${size} ml · ${scent.id} · ${scent.name}` : 'Wähle deine Größe und deinen Duft.';
        if(scent){document.getElementById('selected-mini').src = scent.image;document.getElementById('selected-scent-title').textContent = `NØTE. ${scent.id}`;document.getElementById('selected-scent-description').textContent = scent.name;document.getElementById('open-selector').setAttribute('aria-label',`Duftfüllung ändern: NØTE. ${scent.id}, ${scent.name}`);}
        persist();
    }
    async function loadProducts() {
        if(pending) return pending;
        failed = false;
        pending = loadStorefrontProducts().then(items => {
            catalog = items.find(product => product.id === 'DUFTROLLER');
            available = !!catalog && Object.keys(VARIANTS).every(key => Number(catalog.variants?.[key]?.price)>0);
            if(!available) throw Error('Der Duftroller ist momentan nicht verfügbar.');
            Object.keys(VARIANTS).forEach(key => {document.querySelectorAll(`[data-roller-price="${key}"]`).forEach(node => { node.textContent = money(Number(catalog.variants[key].price)); });});
            render();return items;
        }).catch(error => {pending = null;available = false;failed = true;render();throw error;});
        return pending;
    }
    const picker = window.NoteScentPicker({lock,unlock,loadProducts,
        onSelect:selected => {pendingScentId = '';scent = selected;render();},
        onLoad:() => {
            // Validate a saved scent only after a successful load, including retries.
            if (pendingScentId) scent = picker.select(pendingScentId) || null;
            pendingScentId = '';
            render();
        }
    });
    function selectSize(value) {
        if (!Object.hasOwn(VARIANTS, value)) return;
        size = value;
        gallery?.setFilter(thumb => thumb.dataset.gallerySize === size);
        render();
    }
    document.querySelectorAll('[name="roller-size"]').forEach(input => input.addEventListener('change', () => selectSize(input.value)));
    document.querySelectorAll('[data-select-roller]').forEach(link => link.addEventListener('click', event => {
        event.preventDefault();
        selectSize(link.dataset.selectRoller);
        document.querySelector(`[name="roller-size"][value="${size}"]`).focus({preventScroll:true});
        document.getElementById('konfigurator-roller').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    }));
    button.addEventListener('click',async () => {
        if(!available){button.disabled=true; await picker.load(); return;}
        if(!scent){picker.open();return;}
        const id = `DUFTROLLER-${size}-${scent.id}`, cart = window.NoteCart.read();
        const existing = cart.find(item => item.cartId === id || item.id === id);
        if(existing && Number(existing.quantity)>=20){status.textContent='Maximal 20 Stück je Größe und Duftfüllung.';return;}
        const item = {id,cartId:id,productId:'DUFTROLLER',productType:'duftroller',name:'NØTE. Duftroller',size,scentId:scent.id,scentName:scent.name,price:price(),originalPrice:null,image:image(size),quantity:existing?Number(existing.quantity)+1:1};
        if(existing)Object.assign(existing,item);else cart.push(item);
        window.NoteCart.write(cart);window.dispatchEvent(new CustomEvent('note:cart-updated'));
        const toast=document.getElementById('toast');toast.textContent=`${size} ml · ${scent.id} liegt im Warenkorb.`;toast.classList.add('is-visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('is-visible'),2400);
    });
    gallery = window.NoteImageGallery({lock,unlock,mainImage:document.getElementById('roller-main-image'),tapToOpen:true,initialFilter:thumb => thumb.dataset.gallerySize === size});
    document.getElementById('cookie-settings')?.addEventListener('click',event=>{event.preventDefault();window.NOTE_openCookieResetDialog?.();});
    async function loadReviews(){
        const root=document.getElementById('roller-reviews-list'),summary=document.getElementById('roller-review-summary');
        try{
            const response=await window.NoteApi.fetch(window.NoteApi.base+'/api/products/DUFTROLLER/reviews');if(!response.ok)throw Error();const data=await response.json();
            const count=Number(data.summary?.count)||0;if(!count)return;
            summary.textContent=`${Number(data.summary.average).toLocaleString('de-DE',{maximumFractionDigits:1})} / 5 · ${count} ${count===1?'Bewertung':'Bewertungen'}`;
            root.replaceChildren();for(const review of (data.reviews||[]).slice(0,6)){const article=document.createElement('article');article.className='roller-review';const name=document.createElement('strong');name.textContent=review.authorName;const stars=document.createElement('small');stars.textContent=` · ${review.rating} / 5${review.verifiedPurchase?' · Verifizierter Kauf':''}`;const comment=document.createElement('p');comment.textContent=review.comment;article.append(name,stars,comment);root.append(article);}
        }catch{summary.textContent='Kundenbewertungen';root.textContent='Bewertungen können gerade nicht geladen werden.';}
    }
    render();
    picker.load();
    loadReviews();
})();
