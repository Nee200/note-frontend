const fs = require('fs');

const cssOverride = `

/* --- V17 Epic Spacing: Pushing the Footer Waves Down --- */

/* Pushing the entire Newsletter/Footer section (including its massive top waves) drastically further down */
/* This provides a huge 'breathing room' canvas of pure cream background between the unified feature box and the cresting sine waves */
.newsletter-section {
    margin-top: 220px !important; /* Massive gap to let the waves and the feature box breathe on their own */
    padding-top: 60px !important; /* Ensure the text inside the black box also has breathing room from the wave base */
}

/* Ensure the unified feature box itself has no lingering messy margins colliding downwards */
.features-unified {
    margin-bottom: 0px !important; 
}
`;

fs.appendFileSync('style.css', cssOverride);
console.log('Massive top margin injected to the newsletter section, creating vast breathing space for the 200px sine waves!');
