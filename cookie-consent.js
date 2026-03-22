// NØTE. Cookie Consent Banner – DSGVO-konform
(function () {
    // Bereits entschieden? Banner nicht zeigen.
    if (localStorage.getItem('cookie_consent')) return;

    // Styles einbetten
    const style = document.createElement('style');
    style.textContent = `
        #cookie-banner {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 999999;
            background: #111110;
            border-top: 1px solid #2c2c2a;
            padding: 1.1rem 2.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 2rem;
            font-family: 'Inter', -apple-system, sans-serif;
            box-shadow: 0 -8px 40px rgba(0,0,0,0.55);
            animation: cookieSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes cookieSlideUp {
            from { transform: translateY(110%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
        }
        #cookie-banner .cookie-text {
            margin: 0;
            color: #999;
            font-size: 0.82rem;
            line-height: 1.55;
            flex: 1;
        }
        #cookie-banner .cookie-text a {
            color: #c9a84c;
            text-decoration: none;
            font-weight: 500;
        }
        #cookie-banner .cookie-text a:hover { text-decoration: underline; }
        #cookie-banner .cookie-text strong {
            color: #e0dcd4;
            font-weight: 600;
        }
        .cookie-btns {
            display: flex;
            gap: 0.65rem;
            flex-shrink: 0;
            align-items: center;
        }
        #cookie-btn-accept {
            background: #c9a84c;
            color: #111;
            border: none;
            padding: 0.6rem 1.5rem;
            font-family: inherit;
            font-size: 0.78rem;
            font-weight: 700;
            letter-spacing: 0.09em;
            text-transform: uppercase;
            cursor: pointer;
            border-radius: 2px;
            transition: background 0.2s, transform 0.1s;
            white-space: nowrap;
        }
        #cookie-btn-accept:hover  { background: #b8913e; }
        #cookie-btn-accept:active { transform: scale(0.97); }
        #cookie-btn-decline {
            background: transparent;
            color: #555;
            border: 1px solid #2e2e2c;
            padding: 0.6rem 1.1rem;
            font-family: inherit;
            font-size: 0.78rem;
            font-weight: 500;
            cursor: pointer;
            border-radius: 2px;
            transition: all 0.2s;
            white-space: nowrap;
        }
        #cookie-btn-decline:hover { color: #888; border-color: #444; }

        @media (max-width: 680px) {
            #cookie-banner {
                flex-direction: column;
                align-items: flex-start;
                padding: 1.1rem 1.2rem 1.3rem;
                gap: 0.9rem;
            }
            .cookie-btns { width: 100%; }
            #cookie-btn-accept,
            #cookie-btn-decline { flex: 1; text-align: center; }
        }
    `;
    document.head.appendChild(style);

    // Banner HTML
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie-Einstellungen');
    banner.innerHTML = `
        <p class="cookie-text">
            <strong>Deine Privatsphäre.</strong>
            Wir nutzen Cookies zur Bereitstellung unserer Dienste – darunter sichere Zahlungsabwicklung via <strong>Stripe</strong>
            sowie unseren Newsletter-Service. Weitere Infos in unserer
            <a href="datenschutz.html">Datenschutzerklärung</a>.
        </p>
        <div class="cookie-btns">
            <button id="cookie-btn-decline">Nur notwendige</button>
            <button id="cookie-btn-accept">Alle akzeptieren</button>
        </div>
    `;
    document.body.appendChild(banner);

    function dismissBanner(consent) {
        localStorage.setItem('cookie_consent', consent);
        banner.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
        banner.style.transform = 'translateY(110%)';
        banner.style.opacity = '0';
        setTimeout(function () { banner.remove(); }, 380);
    }

    document.getElementById('cookie-btn-accept').addEventListener('click', function () {
        dismissBanner('all');
    });
    document.getElementById('cookie-btn-decline').addEventListener('click', function () {
        dismissBanner('minimal');
    });
})();
