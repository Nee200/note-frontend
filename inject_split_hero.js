const fs = require('fs');
const path = require('path');

const applySplitHero = (filename, imgName, title, subtitle) => {
    const filePath = path.join(__dirname, filename);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace the old injected hero
    const regex = /<!-- NEW FULL WIDTH HERO HEADER -->[\s\S]*?<\/header>/is;

    const replacement = `<!-- SPLIT HERO SECION -->
    <section class="split-hero" style="display: flex; flex-wrap: wrap; width: 100%; min-height: 50vh; margin-bottom: 3rem;">
        <div class="split-hero-image" style="flex: 1 1 50%; min-width: 300px; min-height: 350px; background-image: url('images_website/${imgName}'); background-size: cover; background-position: center;">
        </div>
        <div class="split-hero-text" style="flex: 1 1 50%; min-width: 300px; background-color: #fdf2f4; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; padding: 10% 8%; box-sizing: border-box;">
            <h1 style="font-family: 'Playfair Display', serif; font-size: 2.2rem; color: #333; margin-top: 0; margin-bottom: 1.5rem; letter-spacing: 0.05em; text-transform: uppercase;">${title}</h1>
            <p style="font-family: 'Inter', sans-serif; font-size: 0.95rem; color: #555; line-height: 1.6; margin-bottom: 2.5rem; max-width: 500px; letter-spacing: 0.02em;">${subtitle}</p>
            <a href="#products" style="display: inline-block; background-color: #1a1a1a; color: #fff; text-decoration: none; padding: 1rem 2.5rem; font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; transition: background-color 0.3s ease;">Jetzt entdecken</a>
        </div>
    </section>`;

    if (regex.test(content)) {
        content = content.replace(regex, replacement);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filename} successfully`);
    } else {
        console.log(`Could not find old hero in ${filename}`);
    }
};

applySplitHero('frauenduefte.html', 'frauen_hero_webp.webp', 'FRAUENDÜFTE', 'Entdecke unsere luxuriöse Auswahl an charismatischen Damendüften – von frischen Alltagsbegleitern bis hin zu betörenden Signature-Scents für besondere Momente.');
applySplitHero('herrenduefte.html', 'maenner_hero_webp.webp', 'HERRENDÜFTE', 'Kraftvolle und maskuline Duftkompositionen. Entdecke markante Holznoten, frische Nuancen und unverkennbare Signature-Düfte, die nachhaltigen Eindruck hinterlassen.');
