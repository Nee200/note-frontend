(function () {
    const CONSENT_KEY = 'cookie_consent';
    const OPTIONAL_SELECTOR = '[data-consent-category="optional"]';

    function getStoredConsent() {
        return localStorage.getItem(CONSENT_KEY);
    }

    function dispatchConsentEvent(consent) {
        window.dispatchEvent(new CustomEvent('note:cookie-consent-changed', {
            detail: { consent: consent || 'unset' }
        }));
    }

    function activateOptionalResources() {
        document.querySelectorAll(OPTIONAL_SELECTOR).forEach((element) => {
            if (element.dataset.consentLoaded === 'true') return;

            if (element.dataset.consentHref && !element.getAttribute('href')) {
                element.setAttribute('href', element.dataset.consentHref);
            }

            if (element.dataset.consentSrc && !element.getAttribute('src')) {
                element.setAttribute('src', element.dataset.consentSrc);
            }

            element.dataset.consentLoaded = 'true';
        });
    }

    function applyConsent(consent) {
        const normalizedConsent = consent || 'unset';
        document.documentElement.dataset.cookieConsent = normalizedConsent;
        window.NOTE_COOKIE_CONSENT = normalizedConsent;

        if (normalizedConsent === 'all') {
            activateOptionalResources();
        }

        dispatchConsentEvent(normalizedConsent);
    }

    function dismissBanner(banner, consent) {
        localStorage.setItem(CONSENT_KEY, consent);
        applyConsent(consent);

        banner.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
        banner.style.transform = 'translateY(110%)';
        banner.style.opacity = '0';
        setTimeout(() => banner.remove(), 380);
    }

    function ensureResetDialog() {
        if (document.getElementById('cookie-reset-dialog')) {
            return document.getElementById('cookie-reset-dialog');
        }

        const style = document.createElement('style');
        style.textContent = `
            #cookie-reset-dialog {
                position: fixed;
                inset: 0;
                z-index: 1000000;
                display: none;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.45);
                backdrop-filter: blur(3px);
                padding: 1rem;
            }
            #cookie-reset-dialog.open {
                display: flex;
            }
            #cookie-reset-card {
                width: min(92vw, 420px);
                background: #171715;
                color: #f1eee6;
                border: 1px solid #31312e;
                border-radius: 10px;
                box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
                padding: 1.25rem 1.25rem 1rem;
            }
            #cookie-reset-card h3 {
                margin: 0 0 0.55rem;
                font-family: 'Playfair Display', Georgia, serif;
                font-size: 1.35rem;
                color: #fff;
            }
            #cookie-reset-card p {
                margin: 0;
                color: #c7c2b7;
                font-size: 0.92rem;
                line-height: 1.6;
            }
            .cookie-reset-actions {
                display: flex;
                justify-content: flex-end;
                gap: 0.75rem;
                margin-top: 1.2rem;
            }
            .cookie-reset-btn {
                border: none;
                border-radius: 6px;
                padding: 0.7rem 1rem;
                font-family: 'Inter', Arial, sans-serif;
                font-size: 0.78rem;
                font-weight: 700;
                letter-spacing: 0.06em;
                text-transform: uppercase;
                cursor: pointer;
            }
            .cookie-reset-btn-secondary {
                background: transparent;
                color: #d2cdc2;
                border: 1px solid #4a4944;
            }
            .cookie-reset-btn-primary {
                background: #c9a84c;
                color: #111;
            }
        `;
        document.head.appendChild(style);

        const dialog = document.createElement('div');
        dialog.id = 'cookie-reset-dialog';
        dialog.innerHTML = `
            <div id="cookie-reset-card" role="dialog" aria-modal="true" aria-labelledby="cookie-reset-title">
                <h3 id="cookie-reset-title">Cookie-Einstellungen zurücksetzen?</h3>
                <p>Wenn du fortfährst, wird deine aktuelle Auswahl gelöscht und der Cookie-Banner beim Neuladen erneut angezeigt.</p>
                <div class="cookie-reset-actions">
                    <button type="button" class="cookie-reset-btn cookie-reset-btn-secondary" data-cookie-reset-close>Abbrechen</button>
                    <button type="button" class="cookie-reset-btn cookie-reset-btn-primary" data-cookie-reset-confirm>Zurücksetzen</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        dialog.addEventListener('click', (event) => {
            if (event.target === dialog || event.target.hasAttribute('data-cookie-reset-close')) {
                dialog.classList.remove('open');
            }
        });

        dialog.querySelector('[data-cookie-reset-confirm]').addEventListener('click', () => {
            resetConsent();
        });

        return dialog;
    }

    function resetConsent() {
        localStorage.removeItem(CONSENT_KEY);
        applyConsent(null);
        localStorage.removeItem('nl_dismissed');
        window.location.reload();
    }

    function openResetDialog() {
        ensureResetDialog().classList.add('open');
    }

    function injectBanner() {
        if (document.getElementById('cookie-banner')) return;

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
                to   { transform: translateY(0); opacity: 1; }
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
            #cookie-btn-accept:hover { background: #b8913e; }
            #cookie-btn-accept:active { transform: scale(0.97); }
            #cookie-btn-decline {
                background: transparent;
                color: #c8c4ba;
                border: 1px solid #3b3b39;
                padding: 0.6rem 1.1rem;
                font-family: inherit;
                font-size: 0.78rem;
                font-weight: 500;
                cursor: pointer;
                border-radius: 2px;
                transition: all 0.2s;
                white-space: nowrap;
            }
            #cookie-btn-decline:hover { color: #fff; border-color: #666; }
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

        const banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Cookie-Einstellungen');
        banner.innerHTML = `
            <p class="cookie-text">
                <strong>Deine Privatsphäre.</strong>
                Wir laden optionale Drittanbieter-Ressourcen wie <strong>Stripe</strong>, externe Schriftarten und Icon-CDNs erst nach deiner Zustimmung.
                Mehr dazu in der <a href="datenschutz.html">Datenschutzerklärung</a>.
            </p>
            <div class="cookie-btns">
                <button id="cookie-btn-decline">Nur notwendige</button>
                <button id="cookie-btn-accept">Alle akzeptieren</button>
            </div>
        `;
        document.body.appendChild(banner);

        document.getElementById('cookie-btn-accept').addEventListener('click', () => {
            dismissBanner(banner, 'all');
        });
        document.getElementById('cookie-btn-decline').addEventListener('click', () => {
            dismissBanner(banner, 'minimal');
        });
    }

    const storedConsent = getStoredConsent();
    applyConsent(storedConsent);

    window.NOTE_resetCookieConsent = resetConsent;
    window.NOTE_openCookieResetDialog = openResetDialog;

    if (!storedConsent) {
        injectBanner();
    }
})();
