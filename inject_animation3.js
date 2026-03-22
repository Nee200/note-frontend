const fs = require('fs');

const content = `

/* Font and Line Weight Boost Override */
.nav-links a:not(.close-menu-btn) {
    font-weight: 600 !important;
    letter-spacing: 0.12em !important; 
}

.nav-links a:not(.close-menu-btn)::after {
    height: 3px !important;
    bottom: -3px !important;
}
`;

try {
    fs.appendFileSync('style.css', content);
    console.log('Appended successfully');
} catch (e) {
    console.error('Failed:', e);
}
