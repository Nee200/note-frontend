(function () {
    const replacements = [
        ['Ã‚Â§', '§'],
        ['Â§', '§'],
        ['Ã‚Â§', '§'],
        ['Â§', '§'],
        ['Ã¤', 'ae'],
        ['Ã¶', 'oe'],
        ['Ã¼', 'ue'],
        ['Ã„', 'Ae'],
        ['Ã–', 'Oe'],
        ['Ãœ', 'Ue'],
        ['ÃŸ', 'ss'],
        ['Ã ', 'a'],
        ['Ã¢â‚¬Å¾', '"'],
        ['â€ž', '"'],
        ['â€œ', '"'],
        ['â€¢', '•'],
        ['âœ“', '✓'],
        ['âœ—', '✗'],
        ['Ã¢Å“â€œ', '✓'],
        ['Ã¢Å“â€”', '✗'],
        ['Ã¢Å“Â¦', '✦'],
        ['S.Ã  r.l.', 'S.à r.l.'],
        ['zur?ck', 'zurueck'],
        ['sp?testens', 'spaetestens'],
        ['ausdr?cklich', 'ausdruecklich'],
        ['fr?here', 'fruehere'],
        ['Ma?nahmen', 'Massnahmen'],
        ['?ndern', 'aendern'],
        ['TMG', 'DDG']
    ];

    function fixString(input) {
        let output = input;
        for (const [bad, good] of replacements) {
            if (output.indexOf(bad) !== -1) {
                output = output.split(bad).join(good);
            }
        }
        return output;
    }

    function fixTextNodes(root) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        for (const node of nodes) {
            const fixed = fixString(node.nodeValue || '');
            if (fixed !== node.nodeValue) {
                node.nodeValue = fixed;
            }
        }
    }

    function startObserver() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'characterData' && mutation.target) {
                    const fixed = fixString(mutation.target.nodeValue || '');
                    if (fixed !== mutation.target.nodeValue) {
                        mutation.target.nodeValue = fixed;
                    }
                }
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node && node.nodeType === Node.TEXT_NODE) {
                            const fixed = fixString(node.nodeValue || '');
                            if (fixed !== node.nodeValue) {
                                node.nodeValue = fixed;
                            }
                        } else if (node && node.nodeType === Node.ELEMENT_NODE) {
                            fixTextNodes(node);
                        }
                    });
                }
            }
        });
        observer.observe(document.body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.title) {
        document.title = fixString(document.title);
    }
    fixTextNodes(document.body);
    startObserver();
})();
