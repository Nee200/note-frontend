const fs = require('fs');

const cssOverride = `

/* Mobile Split Hero Full Asset Visibility */
@media screen and (max-width: 768px) {
    .split-hero-image {
        min-height: unset !important;
        height: auto !important;
        aspect-ratio: 3168 / 1344 !important; /* Perfect 21:9 original image mapping */
        width: 100% !important;
        background-size: cover !important; /* Contains strictly inside the native aspect ratio block */
        background-position: center !important;
    }
}
`;

fs.appendFileSync('style.css', cssOverride);
console.log('Mobile crop successfully bypassed and fixed!');
