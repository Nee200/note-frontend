const fs = require('fs');

const animateFix = `

/* --- V2 Animation Fixes & Upgrades --- */

/* Truck Fix: Extreme Speed Effects */
.icon-truck {
    animation: engineVibeFast 0.15s linear infinite alternate !important;
}
@keyframes engineVibeFast {
    0% { transform: translateY(0px) rotate(0deg); }
    100% { transform: translateY(2.5px) rotate(-1deg); }
}
.tire {
    animation: spinTire 0.4s linear infinite !important;
}

.speed-line {
    stroke-width: 1.5px !important; /* Thicker wind */
    stroke-dasharray: 8 !important; /* Longer streaks */
    animation: windDashFast 0.4s linear infinite !important;
    opacity: 0.8 !important;
}
.sl-1 { stroke-dasharray: 12 !important; animation-duration: 0.3s !important; }
.sl-2 { stroke-dasharray: 6 !important; animation-duration: 0.5s !important; animation-delay: 0.1s !important; stroke-width: 2px !important; }
.sl-3 { stroke-dasharray: 10 !important; animation-duration: 0.35s !important; animation-delay: 0.2s !important; }
@keyframes windDashFast {
    0% { transform: translateX(12px); opacity: 0; }
    20% { opacity: 1; }
    100% { transform: translateX(-25px); opacity: 0; }
}

/* Box Fix: Flip the lid to simulate real cardboard flaps opening */
.box-lid {
    /* The top points are at Y: 6.96. We flip across this axis so it turns from \\/ to /\\ */
    transform-origin: 12px 6.96px !important;
    transform-box: fill-box !important; 
    animation: flapOpen 4s ease-in-out infinite !important;
}

@keyframes flapOpen {
    0%, 20%, 80%, 100% { 
        transform: scaleY(1); /* Closed */
    }
    40%, 60% { 
        transform: scaleY(-0.8) translateY(-2px); /* Flaps flip outwards and up */
    }
}
`;

fs.appendFileSync('style.css', animateFix);
console.log('Box flaps and truck speed upgraded!');
