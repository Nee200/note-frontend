const fs = require('fs');

const cssOverride = `

/* --- V14 Rich Wavy Multi-Color Layering --- */

.newsletter-section::before {
    content: '';
    position: absolute;
    top: -150px; /* Enhanced height for deeply oscillating waves */
    left: 0;
    width: 100vw;
    height: 150px;
    transform: translateY(1px); /* Sub-pixel anti-aliasing occlusion lock */
    background-image: 
        /* LAYER 1 (FRONT): Wavy Solid Black Body */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='%23111111' fill-opacity='1' d='M0,160 C 100,230, 200,90, 320,160 C 440,230, 540,90, 640,160 C 740,230, 840,90, 960,160 C 1080,230, 1180,90, 1280,160 C 1340,195, 1400,125, 1440,160 L1440,320 L0,320 Z'%3E%3C/path%3E%3C/svg%3E"),
        
        /* LAYER 2: Strong Brilliant Gold (Thick, highly opaque 85%) */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='%23d4af37' fill-opacity='0.85' d='M0,180 C 150,80, 250,280, 400,180 C 550,80, 650,280, 800,180 C 950,80, 1050,280, 1200,180 C 1300,130, 1380,220, 1440,140 L1440,320 L0,320 Z'%3E%3C/path%3E%3C/svg%3E"),
        
        /* LAYER 3: Luxurious Champagne / Cream color (The 3rd matching color requested) */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='%23e8d8bd' fill-opacity='0.75' d='M0,130 C 120,300, 220,40, 380,130 C 540,220, 640,40, 780,130 C 920,220, 1020,40, 1160,130 C 1280,210, 1380,70, 1440,110 L1440,320 L0,320 Z'%3E%3C/path%3E%3C/svg%3E"),
        
        /* LAYER 4: A deep dark metallic Bronze/Copper backing just for ultimate 3D depth */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'%3E%3Cpath fill='%23c48b36' fill-opacity='0.5' d='M0,210 C 140,40, 240,300, 420,210 C 600,120, 700,300, 880,210 C 1060,120, 1160,300, 1340,210 C 1390,165, 1420,250, 1440,200 L1440,320 L0,320 Z'%3E%3C/path%3E%3C/svg%3E");
    
    background-size: 100vw 150px;
    background-repeat: no-repeat;
    background-position: left bottom;
    z-index: 10;
}
`;

fs.appendFileSync('style.css', cssOverride);
console.log('Intensively wavy, rich cubic bezier paths spanning 3 colors injected!');
