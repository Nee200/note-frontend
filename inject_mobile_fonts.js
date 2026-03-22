const fs = require('fs');

const cssOverride = `

/* Mobile Hero Text Subtlety Override */
@media screen and (max-width: 768px) {
    .split-hero-text h1 {
        font-size: 1.6rem !important; /* Smaller text size on mobile */
        letter-spacing: 0.03em !important; /* Slightly tighter, less dominant */
        margin-bottom: 1rem !important; /* Tighter padding underneath */
    }
    .split-hero-text {
        padding: 8% 6% !important; /* Reduce the huge thick paddings slightly on mobile */
    }
}
`;

fs.appendFileSync('style.css', cssOverride);
console.log('Mobile hero fonts successfully miniaturized!');
