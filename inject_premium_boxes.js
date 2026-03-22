const fs = require('fs');

const cssOverride = `

/* Premium Editorial Feature Boxes */
.features-bar {
    background: #fbfaf9 !important; /* Very soft parchment/cream background */
}

.feature-item {
    background: #ffffff !important;
    border: none !important;
    border-radius: 2px !important; /* Minimalist, high-end editorial corners */
    padding: 3.5rem 2rem !important;
    box-shadow: 0 15px 35px rgba(0,0,0,0.03) !important;
    transition: transform 0.5s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.5s ease !important;
    position: relative;
    overflow: hidden;
    cursor: default;
    height: 100%;
}

/* Elegant gold/primary accent line that draws itself on hover */
.feature-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: var(--primary); /* Assumes --primary is defined, else falls back. Usually it's gold/copper */
    background: linear-gradient(90deg, #d4af37, #f3e5ab); /* Premium gold gradient fallback */
    transform: scaleX(0);
    transition: transform 0.6s cubic-bezier(0.19, 1, 0.22, 1);
    transform-origin: center;
}

.feature-item:hover::before {
    transform: scaleX(1);
}

.feature-item:hover {
    transform: translateY(-10px) !important;
    box-shadow: 0 25px 50px rgba(0,0,0,0.06) !important;
}

/* Continuous Elegant Icon Floating Animation */
@keyframes continuousFloat {
    0%   { transform: translateY(0px); }
    50%  { transform: translateY(-7px) scale(1.05); }
    100% { transform: translateY(0px); }
}

.feature-icon-wrapper svg {
    animation: continuousFloat 4s ease-in-out infinite !important;
    color: #4a4a4a !important; /* Elegant dark grey instead of harsh black */
    stroke-width: 1.2px; /* Thinner, more delicate line art */
}

/* Stagger the animations slightly so they don't look awkwardly robotic moving at the exact same time */
.feature-item:nth-child(1) .feature-icon-wrapper svg { animation-delay: 0s !important; }
.feature-item:nth-child(2) .feature-icon-wrapper svg { animation-delay: 1s !important; }
.feature-item:nth-child(3) .feature-icon-wrapper svg { animation-delay: 2s !important; }
.feature-item:nth-child(4) .feature-icon-wrapper svg { animation-delay: 0.5s !important; }

/* Let the icons pop even higher when hovered additionally */
.feature-item:hover .feature-icon-wrapper svg {
    color: #000 !important;
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
}
`;

fs.appendFileSync('style.css', cssOverride);
console.log('Premium editorial boxes and continuous staggering animations injected!');
