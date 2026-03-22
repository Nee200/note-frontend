const fs = require('fs');

const rebuildBox = () => {
    let indexHtml = fs.readFileSync('index.html', 'utf8');

    // Replace the old isometric cube box entirely with a new front-facing flap box
    indexHtml = indexHtml.replace(
        /<div class="feature-icon-wrapper box-anim-wrapper">[\s\S]*?<\/div>/,
        `<div class="feature-icon-wrapper box-anim-wrapper">
            <svg class="icon-box" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 10 h16 v12 H4 z" class="box-body"></path>
                <line x1="12" y1="10" x2="12" y2="22" class="box-tape"></line>
                <line x1="4" y1="10" x2="12" y2="10" class="left-flap"></line>
                <line x1="20" y1="10" x2="12" y2="10" class="right-flap"></line>
                <path d="M12 2v6" class="magic-vapor magic-1"></path>
                <path d="M8 4v4" class="magic-vapor magic-2"></path>
                <path d="M16 4v4" class="magic-vapor magic-3"></path>
            </svg>
        </div>`
    );

    fs.writeFileSync('index.html', indexHtml, 'utf8');

    const cssPatch = `

/* --- V3 Animation Perfect Tuning --- */

/* 1. Slow down the truck to a reasonable fast speed :D */
.icon-truck {
    animation: engineVibeNormal 0.3s ease-in-out infinite alternate !important;
}
@keyframes engineVibeNormal {
    0% { transform: translateY(0px) rotate(0deg); }
    100% { transform: translateY(1px) rotate(-0.5deg); }
}
.speed-line {
    animation-duration: 0.6s !important;
    stroke-width: 1.2px !important;
}
.sl-1 { animation-duration: 0.5s !important; }
.sl-2 { animation-duration: 0.7s !important; stroke-width: 1.5px !important; }
.sl-3 { animation-duration: 0.55s !important; }

/* 2. Brand New Box with Real Flaps */
.left-flap {
    transform-origin: 4px 10px !important;
    transform-box: fill-box !important;
    animation: flapLeftOpen 4s ease-in-out infinite !important;
}
.right-flap {
    transform-origin: 20px 10px !important;
    transform-box: fill-box !important;
    animation: flapRightOpen 4s ease-in-out infinite !important;
}
@keyframes flapLeftOpen {
    0%, 20%, 80%, 100% { transform: rotate(0deg); }
    40%, 60% { transform: rotate(-130deg); }
}
@keyframes flapRightOpen {
    0%, 20%, 80%, 100% { transform: rotate(0deg); }
    40%, 60% { transform: rotate(130deg); }
}

/* 3. Re-adjust vapor for three streams */
.magic-1, .magic-2, .magic-3 {
    stroke-dasharray: 8 !important;
    stroke-dashoffset: 8 !important;
    opacity: 0 !important;
    animation: vaporRiseStreams 4s infinite ease-out !important;
}
.magic-2 { animation-delay: 0.2s !important; }
.magic-3 { animation-delay: 0.4s !important; }

@keyframes vaporRiseStreams {
    0%, 30% { stroke-dashoffset: 8; opacity: 0; transform: translateY(0); }
    45% { stroke-dashoffset: 0; opacity: 0.8; transform: translateY(-4px); }
    60%, 100% { stroke-dashoffset: -8; opacity: 0; transform: translateY(-8px); }
}
`;

    fs.appendFileSync('style.css', cssPatch);
    console.log('Completely new box design implemented and truck speeds normalized, captain!');
};

rebuildBox();
