const fs = require('fs');

const cssOverride = `

/* --- V11 Perfect Wave Rendering --- */

.newsletter-section::before {
    content: '';
    position: absolute;
    top: -100px; /* Exact height above the top */
    left: 0;
    width: 100%; /* If placed at left:0 in the flow, 100% works dynamically */
    height: 100px; /* Elegant, subtle wave height */
    transform: none; /* No confusing manual pulling needed */
    background-image: 
        /* Back wave (10% Gold) */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='%23d4af37' fill-opacity='0.1' d='M0,288L80,277.3C160,267,320,245,480,213.3C640,181,800,139,960,144C1120,149,1280,203,1360,229.3L1440,256L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z'%3E%3C/path%3E%3C/svg%3E"),
        /* Middle wave (25% Gold) */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='%23d4af37' fill-opacity='0.25' d='M0,64L60,96C120,128,240,192,360,192C480,192,600,128,720,138.7C840,149,960,235,1080,245.3C1200,256,1320,192,1380,160L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z'%3E%3C/path%3E%3C/svg%3E"),
        /* Front wave (Solid Black to match Newsletter) */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='%23111111' fill-opacity='1' d='M0,160L48,149.3C96,139,192,117,288,144C384,171,480,245,576,250.7C672,256,768,192,864,154.7C960,117,1056,107,1152,122.7C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E");
    background-size: 100% 100px;
    background-repeat: no-repeat;
    background-position: left bottom;
    z-index: 10;
}
`;

fs.appendFileSync('style.css', cssOverride);
console.log('Waves meticulously tuned to render smoothly ignoring native SVG bounds.');
