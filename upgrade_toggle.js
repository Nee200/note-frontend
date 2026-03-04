const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

const oldToggleHTML = `<div class="delivery-toggle" style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <button class="btn btn-outlined-card delivery-btn active" id="btn-shipping" onclick="setDeliveryMethod('shipping')" style="flex: 1; padding: 10px; font-size: 0.85rem;">Postversand</button>
                    <button class="btn btn-outlined-card delivery-btn" id="btn-pickup" onclick="setDeliveryMethod('pickup')" style="flex: 1; padding: 10px; font-size: 0.85rem;">Abholung (Bar)</button>
                </div>`;

const newToggleHTML = `<div class="delivery-toggle-container">
                    <button class="delivery-btn active" id="btn-shipping" onclick="setDeliveryMethod('shipping')">
                        <i class="fas fa-truck"></i>
                        <span>Postversand</span>
                    </button>
                    <button class="delivery-btn" id="btn-pickup" onclick="setDeliveryMethod('pickup')">
                        <i class="fas fa-store"></i>
                        <span>Abholung (Bar)</span>
                    </button>
                </div>`;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes(oldToggleHTML)) {
        content = content.replace(oldToggleHTML, newToggleHTML);
        fs.writeFileSync(file, content);
    } else if (content.includes('class="delivery-toggle" style="display: flex; gap: 10px; margin-bottom: 15px;"')) {
        // Fallback replacement if exact match fails
        const startIdx = content.indexOf('<div class="delivery-toggle" style="display: flex; gap: 10px; margin-bottom: 15px;">');
        const endStr = '</div>';
        const endIdx = content.indexOf(endStr, startIdx) + endStr.length;
        if (startIdx !== -1) {
            content = content.substring(0, startIdx) + newToggleHTML + content.substring(endIdx);
            fs.writeFileSync(file, content);
        }
    }
}
console.log('Upgraded delivery toggle HTML in all web pages');
