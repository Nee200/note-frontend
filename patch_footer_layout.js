const fs = require('fs');

const cssOverride = `

/* --- V19 Multi-Column Footer Restructure --- */
.footer {
    padding-top: 40px;
    padding-bottom: 40px;
}

.footer-header-logo {
    text-align: center;
    margin-bottom: 50px;
}

.footer-grid-layout {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
    margin-bottom: 40px;
}

.footer-col h4 {
    font-family: 'Inter', sans-serif;
    color: #fcfbf9;
    font-size: 0.9rem;
    font-weight: 700;
    margin-bottom: 25px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}

.footer-col a,
.footer-col p {
    font-family: 'Inter', sans-serif;
    color: #a0a0a0;
    font-size: 0.85rem;
    line-height: 1.6;
    text-decoration: none;
    display: block;
    margin-bottom: 15px;
    transition: color 0.3s ease;
}

.footer-col p {
    margin-bottom: 20px;
}

.footer-col a:hover {
    color: #d4af37;
}

.footer-socials {
    display: flex;
    gap: 15px;
    margin-top: 10px;
}

.footer-socials a {
    color: #fcfbf9;
    font-size: 1.2rem;
    display: inline-block;
    margin-bottom: 0;
}

.footer-socials a:hover {
    color: #d4af37;
}

.footer-bottom-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #333;
    padding-top: 25px;
    flex-wrap: wrap;
    gap: 20px;
}

.footer-bottom-flex .copyright {
    color: #777;
    margin-bottom: 0;
}

/* Responsive adjustments */
@media (max-width: 900px) {
    .footer-grid-layout {
        grid-template-columns: repeat(2, 1fr);
        gap: 3rem;
    }
}

@media (max-width: 600px) {
    .footer-grid-layout {
        grid-template-columns: 1fr;
        text-align: center;
        gap: 2.5rem;
    }
    
    .footer-socials {
        justify-content: center;
    }
    
    .footer-bottom-flex {
        flex-direction: column;
        justify-content: center;
        text-align: center;
    }
}
`;

fs.appendFileSync('style.css', cssOverride);
console.log('Advanced generic CSS grid multi-column footer layout styles appended successfully!');
