const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const missingBlock = `                });
                const data = await res.json();

                if (res.ok && data.success) {
                    feedback.className = 'newsletter-feedback success';
                    feedback.innerHTML = '✓ Perfekt! Schau in deine E-Mails – dein persönlicher Code ist unterwegs.';
                    document.getElementById('newsletter-form').querySelector('.newsletter-input-wrap').style.display = 'none';
                } else if (data.alreadySubscribed) {
                    feedback.className = 'newsletter-feedback info';
                    feedback.innerHTML = 'Diese E-Mail ist bereits angemeldet.';
                    btn.disabled = false;
                    btn.textContent = 'Jetzt sichern';
                } else {
                    throw new Error(data.error || 'Fehler');
                }
            } catch (err) {
                feedback.className = 'newsletter-feedback error';
                feedback.textContent = 'Fehler: ' + (err.message || 'Bitte erneut versuchen.');
                btn.disabled = false;
                btn.textContent = 'Jetzt sichern';
            }
            feedback.style.display = 'block';
        }
    </script>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-header-logo">
                <span style="font-family:'Playfair Display', serif; font-size:2.5rem; font-weight:700; letter-spacing:0.05em; color:#fcfbf9;">NØTE.</span>
                <span style="display:block; font-family:'Inter', sans-serif; font-size:0.75rem; font-weight:400; letter-spacing:0.3em; margin-top:-5px; color:#d4af37;">FRAGRANCES</span>
            </div>
            
            <div class="footer-grid-layout">
                <div class="footer-col">
                    <h4>RECHTLICHES</h4>
                    <a href="agb.html">AGB</a>
                    <a href="impressum.html">IMPRESSUM</a>
                    <a href="widerrufsrecht.html">WIDERRUFSRECHT</a>
                    <a href="datenschutz.html">DATENSCHUTZERKLÄRUNG</a>
                    <a href="versand.html">VERSANDBEDINGUNGEN</a>
                </div>
                <div class="footer-col">
                    <h4>SHOP</h4>
                    <a href="suche.html">KOLLEKTION</a>
                    <a href="#bestseller">BESTSELLER</a>
                    <a href="frauenduefte.html">FRAUENDÜFTE</a>
                    <a href="herrenduefte.html">HERRENDÜFTE</a>
                </div>
                <div class="footer-col">
                    <h4>ÜBER UNS</h4>
                    <p>Willkommen bei unserem jungen Unternehmen für Düfte! Bei uns steht Qualität an erster Stelle.</p>
                    <p>Bei Fragen bitte gern direkt auf Instagram schreiben.</p>
                    <div class="footer-socials">
                        <a href="#"><i class="fab fa-instagram"></i></a>
                        <a href="#"><i class="fab fa-tiktok"></i></a>
                    </div>
                </div>
                <div class="footer-col">
                    <h4>KUNDENSERVICE</h4>
                    <p>Kundensupport: 9:00 bis 17:00 Uhr</p>
                    <p>E-Mail: info@note-fragrances.de</p>
                </div>
            </div>

            <div class="footer-bottom-flex">
                <p class="copyright">&copy; 2026 NØTE. fragrances. Alle Rechte vorbehalten.</p>
                <div class="footer-payments" style="display: flex; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap;">
                    <div class="pay-card" title="Mastercard" style="background: #fff; border: 1px solid #333; border-radius: 4px; padding: 4px 8px; display: flex; align-items: center; justify-content: center; height: 32px; box-sizing: border-box;"><img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" style="height: 20px; width: auto; object-fit: contain; flex-shrink: 0; display: block;"></div>
                    <div class="pay-card" title="Visa" style="background: #fff; border: 1px solid #333; border-radius: 4px; padding: 4px 6px; display: flex; align-items: center; justify-content: center; height: 32px; box-sizing: border-box;"><img src="https://cdn.simpleicons.org/visa/1A1F71" alt="Visa" style="height: 24px; min-width: 40px; object-fit: contain; flex-shrink: 0; display: block;"></div>
                    <div class="pay-card" title="American Express" style="background: #006FCF; border: 1px solid #005bb5; border-radius: 4px; padding: 2px 4px; display: flex; align-items: center; justify-content: center; height: 32px; box-sizing: border-box;"><img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" alt="Amex" style="height: 26px; width: auto; object-fit: contain; flex-shrink: 0; display: block;"></div>
                </div>
            </div>
        </div>
    </footer>

    <!-- Scripts -->
    <script src="script.js?v=1772548916338"></script>
    <script src="banner-sync.js"></script>

    <!-- Newsletter Popup -->
    <div id="nl-backdrop"
        style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:8000;backdrop-filter:blur(3px);opacity:0;transition:opacity 0.3s;">
    </div>
    <div id="nl-popup"
        style="display:none;position:fixed;bottom:32px;right:32px;width:340px;background:#1e1c19;border:1px solid #3a3830;border-radius:8px;z-index:8001;padding:28px 28px 22px;box-shadow:0 20px 60px rgba(0,0,0,0.4);opacity:0;transform:translateY(16px);transition:opacity 0.35s ease,transform 0.35s ease;">
        <button onclick="dismissNewsletter()"
            style="position:absolute;top:12px;right:14px;background:none;border:none;color:#555;font-size:1.2rem;cursor:pointer;line-height:1;"
            title="Schließen">&times;</button>
        <p
            style="margin:0 0 8px;font-size:0.62rem;letter-spacing:0.2em;color:#c9a84c;text-transform:uppercase;font-weight:600;">
            Exklusives Angebot</p>
        <h3
            style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;font-size:1.25rem;color:#f0ece4;font-weight:400;line-height:1.3;">
            5% auf deine<br>erste Bestellung</h3>
        <p style="margin:0 0 18px;font-size:0.8rem;color:#777;line-height:1.6;">Trag dich ein und erhalte deinen
            persönlichen Rabattcode sofort per E-Mail.</p>
        <form id="nl-popup-form" onsubmit="submitNewsletterPopup(event)"
            style="display:flex;flex-direction:column;gap:8px;">
            <input type="email" id="nl-popup-email" required placeholder="deine@email.de"
`;

// Now find the exact insertion points based on the broken state!
const searchPoint1 = "body: JSON.stringify({ email })";
const searchPoint2 = "style=\"padding:11px 14px;background:#2a2820;";

const idx1 = html.indexOf(searchPoint1);
const idx2 = html.indexOf(searchPoint2);

if (idx1 > -1 && idx2 > -1) {
    const fixedContent = html.substring(0, idx1 + searchPoint1.length) + "\\n" + missingBlock + "                " + html.substring(idx2);
    fs.writeFileSync('index.html', fixedContent);
    console.log("Successfully bridged the torn segments and restored the footer!");
} else {
    console.log("Could not find the injection points.");
}
