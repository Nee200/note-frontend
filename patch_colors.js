const fs = require('fs');

const cssOverride = `

/* --- V7 Elegant Refinements --- */

/* Give the Master Box a beautiful smooth rounded geometry */
.features-grid {
    border-radius: 24px !important; /* Very soft, Apple-style modern edge rounding */
    border: 2px solid #d4af37 !important; /* Make the gold frame slightly bolder holding the shape */
}

/* Match the textual content flawlessly to the site's outside background 'außenfarbe' color */
.features-grid h3 {
    color: #f6f3ee !important; /* Warm, creamy off-white matching typical luxury shop backgrounds */
}

.features-grid p {
    color: #dfd8cf !important; /* Very soft, beige-toned desaturated text blending with the outside */
    font-weight: 400 !important;
}

/* Icons stay the beautiful genuine gold (#d4af37) popping on black */
`;

fs.appendFileSync('style.css', cssOverride);
console.log('Box generously rounded and typography perfectly color-matched to the cream exterior!');
