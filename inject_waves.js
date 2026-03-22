const fs = require('fs');

const cssOverride = `

/* --- V9 Multilayer Wave & Gradient Paradies Theme --- */

/* Give the newsletter section relative positioning to anchor the waves */
.newsletter-section {
    position: relative !important;
    /* Deep midnight luxury gradient (Slate Blue to Deep Purplish-Black) */
    background: linear-gradient(145deg, #090e17 0%, #160a1e 100%) !important;
    padding-top: 5rem !important; /* Extra padding so text doesn't clash with wave */
}

/* Extend the bottom color of the gradient smoothly into the footer */
.footer {
    background: #160a1e !important;
}

/* 
 * Multi-layer SVG Background Wave 
 * using layered multiple background-image rendering 
 * and perfect color opacity offsets mapped to #090e17 (the top gradient color)
 */
.newsletter-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 150px; /* How tall the wave peaks are */
    transform: translateY(-98%); /* Pull it perfectly up above the container edge */
    background-image: 
        /* Front Wave: Solid color merging directly into the #090e17 gradient start */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23090e17' fill-opacity='1' d='M0,160L48,149.3C96,139,192,117,288,144C384,171,480,245,576,250.7C672,256,768,192,864,154.7C960,117,1056,107,1152,122.7C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E"),
        /* Second Wave: slightly offset and 50% opacity for depth */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23090e17' fill-opacity='0.4' d='M0,64L60,96C120,128,240,192,360,192C480,192,600,128,720,138.7C840,149,960,235,1080,245.3C1200,256,1320,192,1380,160L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z'%3E%3C/path%3E%3C/svg%3E"),
        /* Third Wave: background offset, 20% opacity for extreme 3D layering */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23090e17' fill-opacity='0.15' d='M0,288L80,277.3C160,267,320,245,480,213.3C640,181,800,139,960,144C1120,149,1280,203,1360,229.3L1440,256L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z'%3E%3C/path%3E%3C/svg%3E");
    background-size: 100% 150px;
    background-repeat: no-repeat;
    background-position: bottom;
    pointer-events: none;
    z-index: 10;
}

`;

fs.appendFileSync('style.css', cssOverride);
console.log('Luxury multilayer waves and deep gradient injected!');
