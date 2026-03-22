const fs = require('fs');

const animateFix = `

/* --- Animation Fixes & Stabilizations --- */

/* Truck Fix: keep tires spinning on their own axes */
.tire {
    transform-box: fill-box !important;
    transform-origin: center !important;
}

/* Box Fix: Isometric scaling looks broken. Just make the lid pop straight up smoothly */
.box-lid {
    transform-origin: center !important;
    animation: lidPop 4s ease-in-out infinite !important;
}
@keyframes lidPop {
    0%, 20%, 80%, 100% { transform: translateY(0); }
    40%, 60% { transform: translateY(-5px); }
}

/* Tone down the vapor / magic so it doesn't look weird */
.magic-vapor {
    animation: vaporRise 4s infinite ease-out !important;
}
@keyframes vaporRise {
    0%, 30% { stroke-dashoffset: 10; opacity: 0; transform: translateY(0); }
    50% { stroke-dashoffset: 0; opacity: 0.6; transform: translateY(-8px); }
    70%, 100% { stroke-dashoffset: -10; opacity: 0; transform: translateY(-12px); }
}

/* Pin Fix: Keep it smooth but not cartoony fast */
.pin-marker {
    animation: pinDropModern 4s cubic-bezier(0.25, 1, 0.5, 1) infinite !important;
}
@keyframes pinDropModern {
    0%, 80%, 100% { transform: translateY(0); }
    10% { transform: translateY(-10px); }
    20% { transform: translateY(0); }
}

/* Oil Drop Fix: Smooth out the puddle so the physics don't look distorted */
.oil-drop {
    transform-origin: 12px 2px !important;
    animation: oilDripModern 4s ease-in-out infinite !important;
}
@keyframes oilDripModern {
    0%, 80%, 100% { transform: translateY(0) scale(1); opacity: 1; }
    30% { transform: translateY(-4px) scaleY(1.1) scaleX(0.95); opacity: 1; }
    50% { transform: translateY(5px) scaleY(0.9) scaleX(1.05); opacity: 0; }
}
.oil-puddle {
    transform-box: fill-box !important;
    transform-origin: center !important;
    animation: puddleSpreadModern 4s ease-out infinite !important;
}
@keyframes puddleSpreadModern {
    0%, 40% { transform: scale(0); opacity: 0; }
    45% { transform: scale(1); opacity: 0.6; }
    80%, 100% { transform: scale(1.2); opacity: 0; }
}
`;

fs.appendFileSync('style.css', animateFix);
console.log('SVG Physics Patched!');
