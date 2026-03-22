const fs = require('fs');

const cssPath = 'style.css';
let content = fs.readFileSync(cssPath, 'utf8');

const targetCSS = `.nav-links a {
    text-decoration: none;
    color: var(--text-light);
    font-weight: 400;
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    transition: color 0.3s;
}

.nav-links a:hover,
.nav-links a.active {
    color: var(--primary);
}`;

const replacementCSS = `.nav-links a {
    text-decoration: none;
    color: var(--text-light);
    font-weight: 400;
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    transition: color 0.3s;
    position: relative;
    display: inline-block;
    padding-bottom: 2px;
}

.nav-links a::after {
    content: '';
    position: absolute;
    width: 0;
    height: 1px;
    bottom: 0;
    left: 50%;
    background-color: var(--primary);
    transition: width 0.3s ease-out;
    transform: translateX(-50%);
}

.nav-links a:not(.close-menu-btn):hover::after,
.nav-links a.active:not(.close-menu-btn):after {
    width: 100%;
}

.nav-links a:hover,
.nav-links a.active {
    color: var(--primary);
}`;

content = content.replace(targetCSS, replacementCSS);

fs.writeFileSync(cssPath, content, 'utf8');
console.log('CSS animated underline injected!');
