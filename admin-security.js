(() => {
    'use strict';
    const labels = { checked: 'Abgleich erfolgt', finding: 'Befunde offen', update: 'Updates verfügbar', partial: 'Teilweise geprüft', missing: 'Nicht geprüft', stale: 'Prüfung veraltet', error: 'Abruf fehlgeschlagen' };
    const allowedHosts = new Set(['github.com', 'nodejs.org', 'www.mongodb.com', 'nvd.nist.gov', 'osv.dev', 'docs.npmjs.com', 'www.npmjs.com', 'docs.github.com', 'developers.cloudflare.com', 'render.com', 'www.cloudflare.com']);
    const node = (tag, text, className) => {
        const element = document.createElement(tag);
        if (text !== undefined) element.textContent = String(text);
        if (className) element.className = className;
        return element;
    };
    function link(url, title) {
        try {
            const parsed = new URL(url);
            if (parsed.protocol !== 'https:' || !allowedHosts.has(parsed.hostname) || parsed.username || parsed.password || parsed.port) return node('span', title);
            const anchor = node('a', title); anchor.href = parsed.href; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; return anchor;
        } catch { return node('span', title); }
    }
    const time = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('de-DE') : 'Noch kein Nachweis';
    function render(payload) {
        const root = document.getElementById('security-overview');
        if (!root) return;
        const expanded = new Set([...root.querySelectorAll('details[open]')].map(item => item.dataset.key));
        root.replaceChildren();
        if (!payload || !Array.isArray(payload.sources)) {
            root.append(node('h3', 'Sicherheitsdaten nicht verfügbar'), node('p', 'Der Status konnte nicht geladen werden. Das bedeutet keine Entwarnung.'));
            return;
        }
        const sources = payload.sources;
        const findings = sources.reduce((sum, source) => sum + (source.findings?.length || 0), 0);
        const updates = sources.reduce((sum, source) => sum + (source.updates?.length || 0), 0);
        const incomplete = sources.filter(source => source.isStale || source.error || source.gaps?.length || source.status === 'missing').length;
        root.append(node('h3', findings ? 'Offene Sicherheitsmeldungen' : incomplete ? 'Sicherheitsprüfung noch unvollständig' : 'Geprüfte Quellen ohne bekannten Befund'));
        root.append(node('p', `${findings} Meldungen · ${updates} verfügbare Updates · ${incomplete} Quellen unvollständig oder veraltet`, 'security-summary'));
        root.append(node('p', payload.scope, 'security-muted'));
        root.append(node('p', payload.running ? 'Serverprüfung läuft. Die Ansicht aktualisiert sich automatisch.' : payload.queued ? 'Serverprüfung vorgemerkt; Start innerhalb einer Minute.' : `Letzter Serverdurchlauf: ${time(payload.completedAt)}. Nächster geplanter Durchlauf: ${time(payload.nextRunAt)}.`, 'security-muted'));
        if (!payload.enabled) root.append(node('p', 'Automatische externe Serverprüfung ist in dieser Umgebung deaktiviert.', 'security-warning'));
        root.append(node('p', 'npm, OSV und GitHub können dieselbe Lücke melden. „Betroffenheit prüfen“ bezeichnet einen Analysehinweis; verfügbare Versionsupdates sind separat aufgeführt. GitHub und Anbieter-Einstellungen haben eigene Prüfzeitpunkte.', 'security-muted'));
        const grid = node('div', undefined, 'security-source-grid');
        for (const source of sources) {
            const section = node('details', undefined, 'security-source');
            section.dataset.status = source.status;
            section.dataset.key = source.key;
            section.open = expanded.has(source.key);
            const summary = node('summary');
            summary.append(node('span', source.label, 'security-source-title'), node('span', labels[source.status] || 'Unbekannt', 'security-badge'));
            section.append(summary, node('p', `Erfolgreich geprüft: ${time(source.checkedAt)}`, 'security-muted'));
            if (source.target) section.append(node('p', source.target, 'security-target'));
            if (source.error) section.append(node('p', source.error + ' Letzter Versuch: ' + time(source.attemptedAt), 'security-warning'));
            if (source.isStale && source.checkedAt) section.append(node('p', 'Ergebnis älter als 36 Stunden. Die angezeigten Befunde sind keine aktuelle Entwarnung.', 'security-warning'));
            if (source.status === 'missing') section.append(node('p', 'Noch keine erfolgreiche Prüfung vorhanden. Zugang oder Prüfnachweis fehlt.', 'security-warning'));
            if (source.summary) section.append(node('p', source.summary));
            for (const gap of source.gaps || []) section.append(node('p', gap, 'security-warning'));
            for (const check of source.checks || []) section.append(node('p', `${check.ok ? '✓' : '⚠'} ${check.label}`, check.ok ? 'security-muted' : 'security-warning'));
            if (source.findings?.length) {
                section.append(node('h4', 'Sicherheitsmeldungen'));
                const list = node('ul', undefined, 'security-findings');
                for (const finding of source.findings) {
                    const item = node('li');
                    item.append(node('strong', `${finding.severity || 'unknown'} · ${finding.id} · ${finding.title}`));
                    item.append(node('p', finding.state === 'review' ? 'Betroffenheit prüfen' : 'Betroffene Version / bestätigter Konfigurationsbefund', 'security-warning'));
                    if (finding.package) item.append(node('p', `${finding.package} ${finding.installed || ''} ${finding.scope ? '(' + finding.scope + ')' : ''}`));
                    if (finding.detail) item.append(node('p', finding.detail));
                    if (finding.url) item.append(link(finding.url, 'Befund öffnen'));
                    list.append(item);
                }
                section.append(list);
            }
            if (source.updates?.length) {
                section.append(node('h4', 'Verfügbare Updates'));
                const list = node('ul');
                for (const update of source.updates) {
                    const item = node('li', `${update.name}: ${update.installed} → ${update.latest}${update.breaking ? ' · möglicher inkompatibler Versionswechsel' : ''}`);
                    if (update.url) item.append(document.createTextNode(' · '), link(update.url, 'Paket'));
                    list.append(item);
                }
                section.append(list);
            }
            for (const url of source.links || []) { const paragraph = node('p'); paragraph.append(link(url, 'Quelle / Anbieter')); section.append(paragraph); }
            if (source.history?.length) {
                const last = source.history.slice(-5).reverse().map(row => `${time(row.at)}: ${row.ok ? (row.findings || 0) + ' Meldungen, ' + (row.updates || 0) + ' Updates' : 'Prüfung fehlgeschlagen'}`);
                section.append(node('p', 'Letzte Prüfungen: ' + last.join(' · '), 'security-muted'));
            }
            grid.append(section);
        }
        root.append(grid);
    }
    window.NoteSecurity = { render };
})();
