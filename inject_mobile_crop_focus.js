const fs = require('fs');

const cssOverride = `

/* Mobile Hero Crop Position Refocus */
@media screen and (max-width: 768px) {
    .split-hero-image {
        min-height: 350px !important;
        aspect-ratio: auto !important; 
        background-size: cover !important;
        background-position: 80% center !important; /* Shift focus to the right side where the models are */
    }
}
`;

fs.appendFileSync('style.css', cssOverride);
console.log('Mobile crop focus updated!');
