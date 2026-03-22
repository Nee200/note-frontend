const fs = require('fs');

const cssOverride = `

/* --- V15 Massive Amplitude Overlapping Ribbons --- */

.newsletter-section::before {
    content: '';
    position: absolute;
    top: -200px; /* Greatly expanded height for massive sweep */
    left: 0;
    width: 100vw;
    height: 200px; /* Greatly expanded height */
    transform: translateY(1px); 
    background-image: 
        /* LAYER 1 (FRONT): Solid Black Foreground Base Wave */
        /* Must stay LOW (High Y coordinates) so it doesn't swallow the colors! */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='%23111111' fill-opacity='1' d='M0,280 C 160,320, 320,240, 480,280 C 640,320, 800,240, 960,280 C 1120,320, 1280,240, 1440,280 L1440,320 L0,320 Z'%3E%3C/path%3E%3C/svg%3E"),
        
        /* LAYER 2: Strong Brilliant Gold (Thick, highly opaque 85%) */
        /* Takes massive vertical swings, crossing over Champagne constantly */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='%23d4af37' fill-opacity='0.9' d='M0,180 C 160,40, 320,300, 480,180 C 640,60, 800,300, 960,180 C 1120,60, 1280,280, 1440,180 L1440,320 L0,320 Z'%3E%3C/path%3E%3C/svg%3E"),
        
        /* LAYER 3: Luxurious Champagne / Cream color */
        /* Takes massive vertical swings completely *out of phase* with Gold to create "Ribbon Intersect" illusion */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='%23e8d8bd' fill-opacity='0.8' d='M0,120 C 160,260, 320,60, 480,160 C 640,260, 800,60, 960,160 C 1120,260, 1280,60, 1440,120 L1440,320 L0,320 Z'%3E%3C/path%3E%3C/svg%3E"),
        
        /* LAYER 4: A deep dark metallic Bronze/Copper backing just for ultimate 3D depth */
        /* Highest reaching wave to anchor the background space */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='%23c48b36' fill-opacity='0.7' d='M0,90 C 160,-20, 320,120, 480,50 C 640,-20, 800,160, 960,70 C 1120,-30, 1280,180, 1440,90 L1440,320 L0,320 Z'%3E%3C/path%3E%3C/svg%3E");
    
    background-size: 100vw 200px; /* Scales the viewBox dynamically into 200px tall ribbon layers */
    background-repeat: no-repeat;
    background-position: left bottom;
    z-index: 10;
}
`;

fs.appendFileSync('style.css', cssOverride);
console.log('Massive amplitude cross-phase ribbons established minimizing black occlusion!');
