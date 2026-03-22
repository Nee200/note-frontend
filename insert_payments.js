const fs = require('fs');
const path = require('path');

const directoryPath = __dirname;
const files = fs.readdirSync(directoryPath).filter(file => file.endsWith('.html'));

const svgs = {
    mastercard: `<div class="pay-card" title="Mastercard" style="background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; padding: 4px 8px; display: flex; align-items: center; justify-content: center; height: 32px; box-sizing: border-box;"><img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" style="height: 20px; width: auto; object-fit: contain; flex-shrink: 0; display: block;"></div>`,
    visa: `<div class="pay-card" title="Visa" style="background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; padding: 4px 6px; display: flex; align-items: center; justify-content: center; height: 32px; box-sizing: border-box;"><img src="https://cdn.simpleicons.org/visa/1A1F71" alt="Visa" style="height: 24px; min-width: 40px; object-fit: contain; flex-shrink: 0; display: block;"></div>`,
    paypal: `<div class="pay-card" title="PayPal" style="background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; padding: 4px 8px; display: flex; align-items: center; justify-content: center; height: 32px; box-sizing: border-box;"><img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" style="height: 18px; width: auto; object-fit: contain; flex-shrink: 0; display: block;"></div>`,
    applepay: `<div class="pay-card" title="Apple Pay" style="background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; padding: 4px 8px; display: flex; align-items: center; justify-content: center; height: 32px; box-sizing: border-box;"><img src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg" alt="Apple Pay" style="height: 16px; width: auto; object-fit: contain; flex-shrink: 0; display: block;"></div>`,
    gpay: `<div class="pay-card" title="Google Pay" style="background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; padding: 4px 8px; display: flex; align-items: center; justify-content: center; height: 32px; box-sizing: border-box;"><img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay" style="height: 16px; width: auto; object-fit: contain; flex-shrink: 0; display: block;"></div>`,
    amex: `<div class="pay-card" title="American Express" style="background: #006FCF; border: 1px solid #005bb5; border-radius: 4px; padding: 2px 4px; display: flex; align-items: center; justify-content: center; height: 32px; box-sizing: border-box;"><img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" alt="Amex" style="height: 26px; width: auto; object-fit: contain; flex-shrink: 0; display: block;"></div>`,
    bancontact: `<div class="pay-card" title="Bancontact" style="background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; padding: 0 8px; display: flex; align-items: center; justify-content: center; height: 32px; box-sizing: border-box;"><img src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 40'%3E%3Cpath d='M8,22 Q20,22 30,12 L8,12 Z' fill='%2302528E'/%3E%3Cpath d='M52,12 Q40,12 30,22 L52,22 Z' fill='%23F6A800'/%3E%3Ctext x='30' y='32' font-family='Arial, sans-serif' font-weight='700' font-size='9.5' fill='%2302528E' text-anchor='middle'%3EBancontact%3C/text%3E%3C/svg%3E" alt="Bancontact" style="height: 22px; width: auto; object-fit: contain; flex-shrink: 0; display: block;"></div>`,
    eps: `<div class="pay-card" title="EPS" style="background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; padding: 0 8px; display: flex; align-items: center; justify-content: center; height: 32px; box-sizing: border-box;"><img src="data:image/svg+xml;utf8,%3Csvg viewBox='0 0 76 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13 16 V12 A6 6 0 0 1 25 12 V16' fill='none' stroke='%23C6005E' stroke-width='2.5' stroke-linecap='round'/%3E%3Crect x='8' y='16' width='22' height='15' rx='3' fill='%23C6005E'/%3E%3Ctext x='19' y='28.5' font-family='Arial, sans-serif' font-weight='900' font-style='italic' font-size='13' fill='%23fff' text-anchor='middle'%3Ee%3C/text%3E%3Ctext x='32' y='29' font-family='Arial, sans-serif' font-weight='900' font-size='18' fill='%23666'%3Eps%3C/text%3E%3Ctext x='33' y='36' font-family='Arial, sans-serif' font-size='5' fill='%23888'%3EÜberweisung%3C/text%3E%3C/svg%3E" alt="EPS" style="height: 24px; width: auto; object-fit: contain; flex-shrink: 0; display: block;"></div>`,
    klarna: `<div class="pay-card" title="Klarna" style="background: #FFB3C7; border: 1px solid #ffa3bb; border-radius: 4px; padding: 4px 10px; display: flex; align-items: center; justify-content: center; height: 32px; box-sizing: border-box;"><span style="color: #0b0529; font-family: Helvetica, Arial, sans-serif; font-weight: 800; font-size: 14px; letter-spacing: -0.5px; line-height: 1; display: inline-block;">Klarna.</span></div>`
};

const replaceRegex = /(<p class="copyright".*?<\/p>)\s*(?:<div class="footer-payments"[\s\S]*?<\/div>)?\s*<\/div>\s*<\/footer>/si;

const replacement = `$1
            <div class="footer-payments" style="display: flex; gap: 8px; justify-content: center; align-items: center; margin-top: 15px; margin-bottom: 5px; flex-wrap: wrap;">
                ${svgs.mastercard}
                ${svgs.visa}
                ${svgs.amex}
                ${svgs.paypal}
                ${svgs.applepay}
                ${svgs.gpay}
                ${svgs.klarna}
                ${svgs.bancontact}
                ${svgs.eps}
            </div>
        </div>
    </footer>`;

let changedCount = 0;

files.forEach(file => {
    const filePath = path.join(directoryPath, file);
    let content = fs.readFileSync(filePath, 'utf8');

    if (replaceRegex.test(content)) {
        const originalContent = content;
        content = content.replace(replaceRegex, replacement);
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${file}`);
            changedCount++;
        }
    }
});
console.log('Update complete.');
