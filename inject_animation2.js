const fs = require('fs');
const content = `

/* Animation Override */
.nav-links a:not(.close-menu-btn) {
    position: relative;
    display: inline-block;
}

.nav-links a:not(.close-menu-btn)::after {
    content: '';
    position: absolute;
    width: 0;
    height: 1.5px;
    bottom: -2px;
    left: 50%;
    background-color: var(--primary);
    transition: width 0.3s ease-out;
    transform: translateX(-50%);
}

.nav-links a:not(.close-menu-btn):hover::after,
.nav-links a.active:not(.close-menu-btn)::after {
    width: 100%;
}
`;

try {
    fs.appendFileSync('style.css', content);
    console.log('Appended successfully');
} catch (e) {
    console.error('Failed:', e);
}
