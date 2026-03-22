const fs = require('fs');

const cssOverride = `

/* --- V8 Footer Integration with Newsletter --- */

.footer {
    background: #1e1c19 !important; /* Unified dark mode matching the newsletter block */
    color: #dedbd3 !important; /* Warm light-grey string for reading clarity */
    border-top: none !important; /* Seamless merge with newsletter */
    padding-top: 2rem !important; /* Less gap to make the newsletter seem like part of the footer */
}

.footer-legal-links a {
    color: #dedbd3 !important;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.8rem;
    transition: color 0.3s ease;
}

.footer-legal-links a:hover {
    color: #d4af37 !important; /* Hovering turns to shop signature gold */
}

.copyright {
    color: #99958f !important;
}

/* Redefine the subtle payment separator for dark mode */
.footer-payments {
    border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
    padding-top: 1rem !important;
    margin-top: 1.5rem !important;
}

/* The payment cards already have explicit internal #fff and specific brand backgrounds set inline in HTML, 
   so they will pop beautifully off the dark #1e1c19 backdrop automatically! */
`;

fs.appendFileSync('style.css', cssOverride);
console.log('Footer merged into the dark newsletter block successfully!');
