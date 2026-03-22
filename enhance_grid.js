const fs = require('fs');

const cssOverride = `

/* --- V6 Premium Black & Gold Mastery --- */

/* Remove the annoying old grey top line from the wrapper section */
.features-bar {
    border-top: none !important;
    background: transparent !important;
}

/* Transform the main container into a luxurious, elevated dark-mode slab */
.features-grid {
    background: #0f0f0f !important; /* Deepest luxurious black */
    border: 1px solid #d4af37 !important; /* Thin, sharp genuine gold accent frame */
    border-radius: 4px !important; /* Sleek, extremely subtle editorial corner rounding */
    box-shadow: 0 30px 60px rgba(0,0,0,0.2) !important; /* High-end floating elevation shadow */
    padding: 3.5rem 2rem !important;
    margin-top: -2rem !important; /* Pull it up slightly into the workflow if needed, or keep 0 */
}

/* Typography transformation to fit the dark background */
.features-grid h3 {
    color: #ffffff !important;
    letter-spacing: 0.1em !important;
}

.features-grid p {
    color: #999999 !important;
    font-weight: 300 !important;
}

/* Premium Gold Icons */
.feature-icon-wrapper svg {
    color: #d4af37 !important; /* Brilliant gold hue matching the border */
    stroke-width: 1.2px !important;
    filter: drop-shadow(0 2px 8px rgba(212, 175, 55, 0.2)); /* Tiny gold structural ambient glow */
}

/* Preserve the structural hover effect on the entire black box */
.features-grid {
    transition: transform 0.5s ease, box-shadow 0.5s ease !important;
}
.features-grid:hover {
    transform: translateY(-8px);
    box-shadow: 0 40px 80px rgba(0,0,0,0.3) !important;
}
`;

fs.appendFileSync('style.css', cssOverride);
console.log('Premium Black & Gold aesthetic applied to the feature box!');
