const fs = require('fs');

const cssOverride = `

/* Feature Item Box Layout and Animations */
.features-bar {
    background: #fafaf9 !important; /* Gentle off-white background to make the white boxes pop */
}

.feature-item {
    background-color: #ffffff !important;
    border: 1px solid #f2ece7 !important;
    border-radius: 12px !important;
    padding: 3rem 2rem !important;
    box-shadow: 0 4px 15px rgba(0,0,0,0.02) !important;
    transition: transform 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease !important;
    cursor: default;
    height: 100%;
}

.feature-item:hover {
    transform: translateY(-8px) !important;
    box-shadow: 0 12px 30px rgba(0,0,0,0.06) !important;
    border-color: #e5dcd6 !important;
}

.feature-icon-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 60px;
}

.feature-icon-wrapper svg {
    transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.4s ease !important;
}

.feature-item:hover .feature-icon-wrapper svg {
    transform: scale(1.2) translateY(-4px) !important;
}
`;

fs.appendFileSync('style.css', cssOverride);
console.log('Feature boxes upgraded with hover animations!');
