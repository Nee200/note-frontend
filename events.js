(function () {
    'use strict';
    const handlers = new Map(); let sequence = 0;
    const types = ['click', 'change', 'input', 'submit', 'error', 'load', 'keydown', 'keyup', 'mouseenter', 'mouseleave'];
    window.NoteEvents = {
        define(id, handler) { handlers.set(id, { handler, static: true }); },
        bind(handler) { const id = 'd' + (++sequence); handlers.set(id, { handler, born: Date.now() }); return id; }
    };
    for (const type of types) document.addEventListener(type, event => {
        for (const element of event.composedPath()) {
            const id = element?.getAttribute?.('data-note-on' + type);
            const entry = id && handlers.get(id);
            if (entry) {
                const result = entry.handler.call(element, event);
                if (result === false) { event.preventDefault(); event.stopPropagation(); }
                if (result?.catch) result.catch(error => console.error('Aktion fehlgeschlagen:', error));
            }
            if (event.cancelBubble) break;
        }
    }, ['load', 'error', 'mouseenter', 'mouseleave'].includes(type));
    // Rendered lists replace their buttons. Discard handlers of removed nodes.
    setInterval(() => {
        const active = new Set();
        document.querySelectorAll(types.map(type => '[data-note-on' + type + ']').join(',')).forEach(element => {
            for (const type of types) { const id = element.getAttribute('data-note-on' + type); if (id) active.add(id); }
        });
        const cutoff = Date.now() - 30000;
        for (const [id, entry] of handlers) if (!entry.static && entry.born < cutoff && !active.has(id)) handlers.delete(id);
    }, 30000);
})();
