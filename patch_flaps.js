const fs = require('fs');

const animateFix = `

/* --- V4 Animation Perfect Hinge Physics --- */
.left-flap {
    transform-origin: left center !important; /* Hinge points perfectly set to the outer edges */
    transform-box: fill-box !important;
    animation: flapLeftOpenFix 3.5s ease-in-out infinite !important;
}
.right-flap {
    transform-origin: right center !important;
    transform-box: fill-box !important;
    animation: flapRightOpenFix 3.5s ease-in-out infinite !important;
}
@keyframes flapLeftOpenFix {
    0%, 20%, 80%, 100% { transform: rotate(0deg); opacity: 1; }
    40%, 60% { transform: rotate(-135deg); opacity: 0.8; } /* left side flap folds heavily back and out */
}
@keyframes flapRightOpenFix {
    0%, 20%, 80%, 100% { transform: rotate(0deg); opacity: 1; }
    40%, 60% { transform: rotate(135deg); opacity: 0.8; } /* right side flap folds heavily back and out */
}
`;

fs.appendFileSync('style.css', animateFix);
console.log('Box flap transform origins patched to left/right center strings.');
