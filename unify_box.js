const fs = require('fs');

const cssOverride = `

/* --- V5 Unified Full-Width Bar Design --- */

/* The entire background bar just matches the site background now */
.features-bar {
    background: transparent !important;
    padding: 4rem 1rem !important;
}

/* Make the grid itself the "one big box" */
.features-grid {
    background: var(--background, #fff) !important;
    border: 1px solid #f0eae4 !important; /* Subtle border acting as the big box */
    border-radius: 12px !important;
    box-shadow: 0 10px 40px rgba(0,0,0,0.03) !important;
    padding: 3rem 1rem !important; /* Padding for the entire block */
    margin: 0 auto;
}

/* Strip the individual styling from the 4 items so they just sit inside the grid cleanly */
.feature-item {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 1rem !important;
    border-radius: 0 !important;
    transform: none !important;
    cursor: default;
}

/* Remove the individual item hover effects and gold lines */
.feature-item::before {
    display: none !important;
}
.feature-item:hover {
    transform: none !important;
    box-shadow: none !important;
    border: none !important;
}

/* But keep the beautiful icon hover effects and continuous animations from inside! */
`;

fs.appendFileSync('style.css', cssOverride);
console.log('4 individual boxes merged into a single unified grid bounding box!');
