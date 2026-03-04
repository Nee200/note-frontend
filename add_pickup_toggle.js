const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

const toggleHTML = `
                <div class="delivery-toggle" style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <button class="btn btn-outlined-card delivery-btn active" id="btn-shipping" onclick="setDeliveryMethod('shipping')" style="flex: 1; padding: 10px; font-size: 0.85rem;">Postversand</button>
                    <button class="btn btn-outlined-card delivery-btn" id="btn-pickup" onclick="setDeliveryMethod('pickup')" style="flex: 1; padding: 10px; font-size: 0.85rem;">Abholung (Bar)</button>
                </div>
                <div id="pickup-form" style="display: none; margin-bottom: 15px;">
                    <input type="text" id="pickup-name" placeholder="Dein Vor- und Nachname" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    <input type="email" id="pickup-email" placeholder="Deine E-Mail-Adresse" style="width: 100%; padding: 10px; margin-bottom: 5px; border: 1px solid #ddd; border-radius: 4px;">
                    <p style="font-size: 0.75rem; color: #666; margin: 0;">Du bezahlst bar bei uns im Store bei Abholung.</p>
                </div>
`;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('delivery-toggle')) {
        content = content.replace('<div class="cart-summary">', '<div class="cart-summary">\n' + toggleHTML);
        fs.writeFileSync(file, content);
    }
}
console.log('Added toggle and checkout form to all HTML files');
