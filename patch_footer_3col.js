const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// The block to replace:
const targetStart = '<footer class="footer">';
const targetEnd = '<!-- Scripts -->';

const idxStart = html.indexOf(targetStart);
const idxEnd = html.indexOf(targetEnd);

if (idxStart > -1 && idxEnd > -1) {
    const newFooter = `<footer class="footer">
        <div class="container">
            <div class="footer-header-logo" style="text-align: center; margin-bottom: 3rem;">
                <a href="#" class="logo-container" style="justify-content: center; transform: scale(1.5);">
                    <span class="logo-main">NØTE.</span>
                    <span class="logo-sub">fragrances</span>
                </a>
            </div>
            
            <div class="footer-grid-layout" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 40px; text-align: center;">
                <div class="footer-col">
                    <h4 style="font-family: 'Inter', sans-serif; color: #fcfbf9; font-size: 0.9rem; font-weight: 700; margin-bottom: 25px; letter-spacing: 0.05em; text-transform: uppercase;">RECHTLICHES</h4>
                    <a href="agb.html" style="font-family: 'Inter', sans-serif; color: #a0a0a0; font-size: 0.85rem; text-decoration: none; display: block; margin-bottom: 15px; transition: color 0.3s ease;">AGB</a>
                    <a href="impressum.html" style="font-family: 'Inter', sans-serif; color: #a0a0a0; font-size: 0.85rem; text-decoration: none; display: block; margin-bottom: 15px; transition: color 0.3s ease;">IMPRESSUM</a>
                    <a href="widerrufsrecht.html" style="font-family: 'Inter', sans-serif; color: #a0a0a0; font-size: 0.85rem; text-decoration: none; display: block; margin-bottom: 15px; transition: color 0.3s ease;">WIDERRUFSRECHT</a>
                    <a href="datenschutz.html" style="font-family: 'Inter', sans-serif; color: #a0a0a0; font-size: 0.85rem; text-decoration: none; display: block; margin-bottom: 15px; transition: color 0.3s ease;">DATENSCHUTZERKLÄRUNG</a>
                    <a href="versand.html" style="font-family: 'Inter', sans-serif; color: #a0a0a0; font-size: 0.85rem; text-decoration: none; display: block; margin-bottom: 15px; transition: color 0.3s ease;">VERSANDBEDINGUNGEN</a>
                </div>
                <div class="footer-col">
                    <h4 style="font-family: 'Inter', sans-serif; color: #fcfbf9; font-size: 0.9rem; font-weight: 700; margin-bottom: 25px; letter-spacing: 0.05em; text-transform: uppercase;">SHOP</h4>
                    <a href="suche" style="font-family: 'Inter', sans-serif; color: #a0a0a0; font-size: 0.85rem; text-decoration: none; display: block; margin-bottom: 15px; transition: color 0.3s ease;">KOLLEKTION</a>
                    <a href="#bestseller" style="font-family: 'Inter', sans-serif; color: #a0a0a0; font-size: 0.85rem; text-decoration: none; display: block; margin-bottom: 15px; transition: color 0.3s ease;">BESTSELLER</a>
                    <a href="frauenduefte.html" style="font-family: 'Inter', sans-serif; color: #a0a0a0; font-size: 0.85rem; text-decoration: none; display: block; margin-bottom: 15px; transition: color 0.3s ease;">FRAUENDÜFTE</a>
                    <a href="herrenduefte.html" style="font-family: 'Inter', sans-serif; color: #a0a0a0; font-size: 0.85rem; text-decoration: none; display: block; margin-bottom: 15px; transition: color 0.3s ease;">HERRENDÜFTE</a>
                </div>
                <div class="footer-col" style="max-width: 300px; margin: 0 auto;">
                    <h4 style="font-family: 'Inter', sans-serif; color: #fcfbf9; font-size: 0.9rem; font-weight: 700; margin-bottom: 25px; letter-spacing: 0.05em; text-transform: uppercase;">ÜBER UNS</h4>
                    <p style="font-family: 'Inter', sans-serif; color: #a0a0a0; font-size: 0.85rem; line-height: 1.6; margin-bottom: 20px;">Willkommen bei unserem jungen Unternehmen für Düfte! Bei uns steht Qualität an erster Stelle.</p>
                </div>
            </div>

            <div class="footer-bottom-flex" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #333; padding-top: 25px; flex-wrap: wrap; gap: 20px;">
                <p class="copyright" style="color: #777; margin-bottom: 0;">&copy; 2026 NØTE. fragrances. Alle Rechte vorbehalten.</p>
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

    `;
    
    // For CSS: ensuring we enforce the 3 column layout across desktop, centering.
    const cssAppend = `
    
/* Update footer grid layout to 3 columns and center everything */
.footer-grid-layout {
    grid-template-columns: repeat(3, 1fr) !important;
    text-align: center !important;
}

@media (max-width: 900px) {
    .footer-grid-layout {
        grid-template-columns: repeat(1, 1fr) !important; /* Stack vertically on small screens */
    }
}
`;

    fs.writeFileSync('index.html', html.substring(0, idxStart) + newFooter + html.substring(idxEnd));
    fs.appendFileSync('style.css', cssAppend);
    console.log('Restored old payment icons, configured 3 column layout, removed Instagram/TikTok, and injected authentic brand Logo!');
} else {
    console.log('Failed to find replace block');
}
