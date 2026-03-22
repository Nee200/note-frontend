const fs = require('fs');

const content = `

/* Mobile Menu Priority Fix */
@media screen and (max-width: 768px) {
    .nav-links {
        z-index: 99999 !important;
        padding-top: 60px !important; /* Extra safe space at the top */
    }
    
    .close-menu-btn {
        z-index: 100000 !important;
        top: 25px !important;
        right: 25px !important;
        font-size: 2rem !important; /* Make X bigger to tap easier */
        font-weight: bold;
    }
}
`;

try {
    fs.appendFileSync('style.css', content);
    console.log('Appended successfully');
} catch (e) {
    console.error('Failed:', e);
}
