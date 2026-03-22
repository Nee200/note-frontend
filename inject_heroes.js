const fs = require('fs');
const path = require('path');

const applyHero = (filename, imgName, title) => {
    const filePath = path.join(__dirname, filename);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace the exact string </nav> <main ...> <h2 ...> -> </nav> <header> <main>
    const navMatch = content.match(/<\/nav>\s*<main\s+id="products"\s+class="container\s+section">\s*<h2\s+class="section-title">.*?<\/h2>/is);

    if (navMatch) {
        const replacement = `</nav>

    <!-- NEW FULL WIDTH HERO HEADER -->
    <header class="hero" style="position: relative; height: 45vh; background-image: url('images_website/${imgName}'); background-size: cover; background-position: center 25%; display: flex; align-items: center; justify-content: center; margin-bottom: 2rem;">
        <div class="hero-overlay" style="position: absolute; inset:0; background: rgba(0,0,0,0.15);"></div>
        <div class="hero-content" style="position: relative; z-index: 10; color: #fff; text-align: center;">
            <h1 style="font-size: 3rem; margin: 0; text-shadow: 0 2px 10px rgba(0,0,0,0.3); font-family: 'Playfair Display', serif;">${title}</h1>
        </div>
    </header>

    <main id="products" class="container section">`;
        
        content = content.replace(navMatch[0], replacement);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filename}`);
    } else {
        console.log(`Could not find nav match in ${filename}`);
    }
};

applyHero('frauenduefte.html', 'frauen_hero_webp.webp', 'Frauendüfte');
applyHero('herrenduefte.html', 'maenner_hero_webp.webp', 'Herrendüfte');
