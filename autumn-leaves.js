(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const layer = document.createElement('div');
    layer.className = 'autumn-leaves';
    layer.setAttribute('aria-hidden', 'true');
    const colors = ['#ad572b', '#bf7937', '#8f3e2d', '#b89141'];
    const leaf = '<svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M32 62 13 49 19 47 7 31 19 33 16 19 27 26 32 7 38 25 49 17 46 33 59 30 47 47 53 48 34 62 33 74 29 74Z" fill="currentColor"/><path d="M32 66V24M32 51 19 38M32 51 46 38M32 39 24 28M32 39 41 28" stroke="#f2d4a3" stroke-width="1" opacity=".5"/></svg>';
    for (let i = 0; i < 12; i++) {
        const item = document.createElement('span');
        item.className = 'autumn-leaf';
        item.innerHTML = leaf;
        item.style.setProperty('--leaf-left', `${(i * 31 + 5) % 96}%`);
        item.style.setProperty('--leaf-size', `${18 + i % 4 * 4}px`);
        item.style.setProperty('--leaf-duration', `${19 + i % 5 * 3}s`);
        item.style.setProperty('--leaf-delay', `${-i * 2.7}s`);
        item.style.setProperty('--leaf-sway', `${4 + i % 3}s`);
        item.style.color = colors[i % colors.length];
        layer.append(item);
    }
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'autumn-leaves-toggle';
    let paused = false;
    const update = () => {
        layer.hidden = motion.matches || paused;
        layer.classList.toggle('is-paused', document.hidden);
        toggle.hidden = motion.matches;
        toggle.textContent = paused ? 'Blätter einblenden' : 'Blätter ausblenden';
        toggle.setAttribute('aria-pressed', String(paused));
    };
    toggle.addEventListener('click', () => { paused = !paused; update(); });
    motion.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    update();
    document.body.append(layer, toggle);
})();
