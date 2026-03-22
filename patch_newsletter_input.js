const fs = require('fs');

const cssOverride = `

/* --- V18 Golden Input Frame --- */
/* Completely redesigning the newsletter email input to pop out with a golden frame */

.newsletter-form input[type="email"] {
    background-color: #111111 !important; /* Pure black to match the background */
    border: 2px solid #d4af37 !important; /* The requested Golden Frame (thicker 2px for luxury pop) */
    color: #fcfbf9 !important; /* Bright cream text so the user's typing is readable */
    border-radius: 4px 0 0 4px !important; /* If attached to button, keep left corners rounded */
    outline: none !important;
    transition: all 0.3s ease !important;
    box-shadow: inset 0 0 10px rgba(0,0,0,0.5) !important; /* Deep luxury inner shadow */
}

/* Add a glowing luxury effect when the user clicks inside the input! */
.newsletter-form input[type="email"]:focus {
    box-shadow: 0 0 15px rgba(212, 175, 55, 0.4), inset 0 0 10px rgba(0,0,0,0.5) !important;
    border-color: #ffd700 !important; /* Brighter gold on active focus */
}

/* Ensure placeholder text is elegant */
.newsletter-form input[type="email"]::placeholder {
    color: rgba(212, 175, 55, 0.5) !important; /* Half-transparent gold placeholder text */
    font-style: italic;
}
`;

fs.appendFileSync('style.css', cssOverride);
console.log('Golden luxury frame with glowing focus effect added to the newsletter input!');
