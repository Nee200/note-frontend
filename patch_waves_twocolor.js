const fs = require('fs');

const cssOverride = `

/* --- V16 Huge Harmonic Two-Color (Gold & Black) Sine Waves --- */

.newsletter-section::before {
    content: '';
    position: absolute;
    top: -200px; /* Big height */
    left: 0;
    width: 100vw;
    height: 200px;
    transform: translateY(1px); 
    background-image: 
        /* LAYER 1 (FRONT Z-INDEX): Low Harmonic Black Foreground */
        /* Smooth base wave dipping gently on the left, rising gently on the right */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='%23111111' fill-opacity='1' d='M0,260 C 180,320, 540,320, 720,260 C 900,200, 1260,200, 1440,260 L1440,320 L0,320 Z'%3E%3C/path%3E%3C/svg%3E"),
        
        /* LAYER 2: Strong Solid Gold (85% Opacity, massive harmonic sine curve) */
        /* Beautiful crest on the left (Y=100), deep valley on the right (Y=300 hidden by black) */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='%23d4af37' fill-opacity='0.85' d='M0,200 C 180,60, 540,60, 720,200 C 900,340, 1260,340, 1440,200 L1440,320 L0,320 Z'%3E%3C/path%3E%3C/svg%3E"),
        
        /* LAYER 3: Soft Shadow Gold (40% Opacity, phase-shifted sine curve) */
        /* Deep valley on the left (Y=240, intersecting Solid Gold), high crest on the right (Y=0) where solid gold hides */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='%23d4af37' fill-opacity='0.4' d='M0,100 C 180,240, 540,240, 720,100 C 900,-40, 1260,-40, 1440,100 L1440,320 L0,320 Z'%3E%3C/path%3E%3C/svg%3E");
    
    background-size: 100vw 200px; 
    background-repeat: no-repeat;
    background-position: left bottom;
    z-index: 10;
}
`;

fs.appendFileSync('style.css', cssOverride);
console.log('Harmonic massive two-color 1440 sine waves generated and fully phase-locked!');
