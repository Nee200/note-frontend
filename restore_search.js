const fs = require('fs');

const searchHtml = `<div class="search-wrapper">
                    <div class="search-overlay" id="search-overlay">
                        <button class="close-search" onclick="toggleSearch()">&times;</button>
                        <div class="search-container">
                            <input type="text" id="search-input" placeholder="Suche..." onkeyup="performSearch()">
                            <div class="search-results" id="search-results"></div>
                        </div>
                    </div>
                    <div class="search-icon" onclick="toggleSearch()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                </div>`;

const restoreSearch = (filename) => {
    let content = fs.readFileSync(filename, 'utf8');

    // Replace the commented out search with the actual global search icon HTML
    content = content.replace(/<!-- Search removed on this page -->/gi, searchHtml);

    fs.writeFileSync(filename, content, 'utf8');
};

restoreSearch('frauenduefte.html');
restoreSearch('herrenduefte.html');
console.log('Search icon restored to the top navigation on category pages!');
