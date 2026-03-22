const fs = require('fs');

const cssOverride = `

/* --- V12 No Straight Lines: The Golden Ribbon Upgrade --- */

.newsletter-section::before {
    content: '';
    position: absolute;
    top: -100px; /* Sits right above the newsletter */
    left: 0;
    width: 100%;
    height: 100px;
    /* Move background slightly down so the black perfectly eclipses any underlying sub-pixel gaps */
    transform: translateY(1px); 
    background-image: 
        /* Back Gold Ribbon: Only the line curvature, completely removed the flat fill body */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='none' stroke='%23d4af37' stroke-opacity='0.25' stroke-width='10' d='M0,288L80,277.3C160,267,320,245,480,213.3C640,181,800,139,960,144C1120,149,1280,203,1360,229.3L1440,256'%3E%3C/path%3E%3C/svg%3E"),
        
        /* Middle Gold Ribbon: Thick abstract curved line floating above */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='none' stroke='%23d4af37' stroke-opacity='0.4' stroke-width='14' d='M0,64L60,96C120,128,240,192,360,192C480,192,600,128,720,138.7C840,149,960,235,1080,245.3C1200,256,1320,192,1380,160L1440,128'%3E%3C/path%3E%3C/svg%3E"),
        
        /* Front Black Wave: Full solid body to perfectly mask the newsletter top-edge seam */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='%23111111' fill-opacity='1' d='M0,160L48,149.3C96,139,192,117,288,144C384,171,480,245,576,250.7C672,256,768,192,864,154.7C960,117,1056,107,1152,122.7C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E");
    
    background-size: 100% 100px;
    background-repeat: no-repeat;
    background-position: left bottom;
    z-index: 10;
}
`;

fs.appendFileSync('style.css', cssOverride);
console.log('Rigid gold fill bodies stripped allowing magnificent abstract ribbon effect layering!');
