const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const missingCode = `                }
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
                    <div class="pay-card" title="PayPal" style="background: #fff; border: 1px solid #333; border-radius: 4px; padding: 4px 8px; display: flex; align-items: center; justify-content: center; height: 32px; box-sizing: border-box;"><img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" style="height: 18px; width: auto; object-fit: contain; flex-shrink: 0; display: block;"></div>
                    <div class="pay-card" title="Apple Pay" style="background: #fff; border: 1px solid #333; border-radius: 4px; padding: 4px 8px; display: flex; align-items: center; justify-content: center; height: 32px; box-sizing: border-box;"><img src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg" alt="Apple Pay" style="height: 16px; width: auto; object-fit: contain; flex-shrink: 0; display: block;"></div>
                    <div class="pay-card" title="Google Pay" style="background: #fff; border: 1px solid #333; border-radius: 4px; padding: 4px 8px; display: flex; align-items: center; justify-content: center; height: 32px; box-sizing: border-box;"><img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay" style="height: 16px; width: auto; object-fit: contain; flex-shrink: 0; display: block;"></div>
                    <div class="pay-card" title="Klarna" style="background: #FFB3C7; border: 1px solid #ffa3bb; border-radius: 4px; padding: 4px 10px; display: flex; align-items: center; justify-content: center; height: 32px; box-sizing: border-box;"><span style="color: #0b0529; font-family: Helvetica, Arial, sans-serif; font-weight: 800; font-size: 14px; letter-spacing: -0.5px; line-height: 1; display: inline-block;">Klarna.</span></div>
                    <div class="pay-card" title="Bancontact" style="background: #fff; border: 1px solid #333; border-radius: 4px; padding: 0 8px; display: flex; align-items: center; justify-content: center; height: 32px; box-sizing: border-box;"><img src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 40'%3E%3Cpath d='M8,22 Q20,22 30,12 L8,12 Z' fill='%2302528E'/%3E%3Cpath d='M52,12 Q40,12 30,22 L52,22 Z' fill='%23F6A800'/%3E%3Ctext x='30' y='32' font-family='Arial, sans-serif' font-weight='700' font-size='9.5' fill='%2302528E' text-anchor='middle'%3EBancontact%3C/text%3E%3C/svg%3E" alt="Bancontact" style="height: 22px; width: auto; object-fit: contain; flex-shrink: 0; display: block;"></div>
                    <div class="pay-card" title="EPS" style="background: #fff; border: 1px solid #333; border-radius: 4px; padding: 0 8px; display: flex; align-items: center; justify-content: center; height: 32px; box-sizing: border-box;"><img src="data:image/svg+xml;utf8,%3Csvg viewBox='0 0 76 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13 16 V12 A6 6 0 0 1 25 12 V16' fill='none' stroke='%23C6005E' stroke-width='2.5' stroke-linecap='round'/%3E%3Crect x='8' y='16' width='22' height='15' rx='3' fill='%23C6005E'/%3E%3Ctext x='19' y='28.5' font-family='Arial, sans-serif' font-weight='900' font-style='italic' font-size='13' fill='%23fff' text-anchor='middle'%3Ee%3C/text%3E%3Ctext x='32' y='29' font-family='Arial, sans-serif' font-weight='900' font-size='18' fill='%23666'%3Eps%3C/text%3E%3Ctext x='33' y='36' font-family='Arial, sans-serif' font-size='5' fill='%23888'%3EÜberweisung%3C/text%3E%3C/svg%3E" alt="EPS" style="height: 24px; width: auto; object-fit: contain; flex-shrink: 0; display: block;"></div>
                </div>
            </div>
        </div>
    </footer>

    <script src="script.js?v=1772548916338"></script>
    <script src="banner-sync.js"></script>

    <!-- Newsletter Popup -->`;

const targetStr = "                } else {\\n                    throw new Error(data.error || 'Fehler');";
const idx = html.indexOf("                } else {\\n                    throw new Error(data.error || 'Fehler');");
const endIdx = html.indexOf('<!-- Newsletter Popup -->');

if (idx > -1 && endIdx > idx) {
    const fixedContent = html.substring(0, idx) + targetStr + '\\n' + missingCode.substring(18) + html.substring(endIdx + 25);
    fs.writeFileSync('index.html', fixedContent);
    console.log("Successfully restored footer and scripts!");
} else {
    console.log("Error finding placement: ", idx, endIdx);
}
