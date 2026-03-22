const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'images_website', 'payments');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const logos = {
    'visa.svg': 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg',
    'mastercard.svg': 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg',
    'amex.svg': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg',
    'paypal.svg': 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg',
    'applepay.svg': 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg',
    'gpay.svg': 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg',
    'klarna.svg': 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Klarna_Logotype.svg',
    'sofort.svg': 'https://upload.wikimedia.org/wikipedia/commons/8/87/Sofort%C3%BCberweisung_logo.svg'
};

async function download(url, dest) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(dest, buffer);
        console.log(`Success: ${dest}`);
    } catch (err) {
        console.error(`Error downloading ${dest}:`, err.message);
    }
}

async function downloadAll() {
    for (const [filename, url] of Object.entries(logos)) {
        await download(url, path.join(dir, filename));
    }
    console.log('All downloads complete!');
}

downloadAll();
