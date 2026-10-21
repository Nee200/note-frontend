# Frontend-Deployment

Stand: 21. Oktober 2026. Quelle: `https://github.com/Nee200/note-frontend.git`. Ziel: Cloudflare Workers mit Static Assets. Die Konfiguration liegt in `wrangler.jsonc`.

## Reproduzierbarer Build

Node.js 24.22.1 oder eine neuere 24.x-Version verwenden:

```powershell
npm ci
npm run build
npm test
npm audit
npx wrangler deploy --dry-run --outdir .wrangler-dry-run
```

`npm run build` erzeugt ausschließlich `dist`. Die feste Einstiegsliste steht in `scripts/build.mjs`. Neue öffentliche Seiten müssen dort bewusst aufgenommen werden. Der Build veröffentlicht 21 HTML-Seiten mit den benötigten Skripten, Styles, lokalen Schriftarten, Bildern, Icons, einem eingebundenen Video und öffentlichen Metadaten. Geschäftsdatenexporte und das Quellverzeichnis werden nicht hochgeladen.

Rasterbilder werden auf höchstens 1600 Pixel begrenzt und als WebP mit Inhaltsprüfsumme ausgegeben. Originaldateien bleiben erhalten. `dist/build-report.json` dokumentiert die Dateisummen; `.build-cache` beschleunigt erneute Builds. Die Produktionsausgabe muss nach Quelländerungen neu gebaut werden.

Inline-JavaScript und Eventattribute werden beim Build in externe, gewöhnliche Funktionen umgewandelt. Der Browser führt dafür weder `eval` noch `new Function` aus. Die CSP erlaubt keine Inline-Skripte; Inline-Styles bleiben wegen des vorhandenen Layouts erlaubt. Schriftarten und Icons werden lokal ausgeliefert, einschließlich Lizenzdateien.

## API und Cookies

Der Stand vom 21. Oktober 2026 fordert Registrierungslinks ohne Passwort an. Erst im E-Mail-Link setzt der Kunde sein Passwort; dafür ist das Backend mit `/api/register/confirm` erforderlich. Eine erfolgreiche Linkanforderung bleibt sichtbar und erzeugt keine Anmeldung. Weiterleitungsziele nach Anmeldung oder Kontobestätigung werden als URL normalisiert und auf dieselbe Shop-Origin begrenzt.

Produktiv verwendet `shop-core.js` dieselbe Origin wie die aufgerufene Shopseite. Der Worker leitet `/api/*`, `/create-checkout-session` und `/create-pickup-order` an **die feste `API_ORIGIN`** weiter. Die Backend-Adresse wird nicht mehr einzeln in mehreren Browser-Skripten gepflegt.

Im Cloudflare Secret-Bereich **`PROXY_SHARED_SECRET` mit genau dem Wert des Backends** setzen. `API_ORIGIN` muss eine HTTPS-Origin ohne Pfad, Query oder Zugangsdaten sein. Aktuelle Vorgabe: `https://note-backend-5gy0.onrender.com`. Eine ungültige Konfiguration liefert 503. Der Worker überschreibt manipulierbare Weiterleitungsheader, erhält Cookies/Request-Body und setzt für API-Antworten `private, no-store`.

Kunden- und Admin-Sitzungen verwenden HttpOnly-Cookies. Sie werden nicht in Local-/SessionStorage gespeichert. Ohne passenden neuen Backend-Stand funktionieren Anmeldung und schreibende API-Aufrufe nicht zuverlässig; beide Komponenten gemeinsam abnehmen.

Newsletter-Links verwenden produktiv die Shop-Origin und erreichen das Backend ebenfalls über den Worker. Stripe sendet Webhooks direkt an den Backend-Endpunkt `/webhook`.

## Caching und Pfade

Nur Dateien unter `/assets/*` mit Inhaltsprüfsummen erhalten ein Jahr `immutable` Browser-Cache. HTML wird auf Aktualität geprüft. Alte Bildpfade aus dem Katalog werden über `asset-manifest.json` auf die neuen Dateien umgeleitet; die bekannten `parfume_men`/`parfume_women`-Aliase bleiben kompatibel.

`_headers` enthält die Regeln für statische Inhalte. Cloudflare führt mehrfach passende Headerwerte zusammen und wendet diese Datei nicht auf selbst erzeugte Worker-Antworten an. Deshalb wird der allgemeine Cache-Control-Standard nicht nochmals gesetzt und werden API-Cacheheader im Worker ergänzt. Siehe [Cloudflare: Static-Asset-Header](https://developers.cloudflare.com/workers/static-assets/headers/).

## Lokale Vorschau und Tests

`npm run preview` bedient den bereits gebauten `dist`-Ordner auf Loopback-Port 5500. Für einen vollständigen Shop mit synthetischer API den Workspace-Start verwenden. Bei einzeln betriebenem Frontend wird eine lokale API auf Port 4242 erwartet.

Der Testlauf öffnet alle 21 Seiten unter der echten CSP. Er prüft Ressourcen-/JavaScriptfehler, externe Ressourcen vor Consent, ausgewählte mobile Layouts, beschädigte Warenkörbe, Registrierung und echte Admin-Interaktionen. Providerantworten sind dabei synthetisch. Zusätzlich werden Event-Compiler, Proxy-Vertrauensgrenze und Ausschluss interner Dateien getestet.

Browser-Ergebnisse: `.build-cache/browser-results.json`, Screenshots: `.build-cache/qa`. Unter Windows Standard-Chrome oder `PUPPETEER_EXECUTABLE_PATH` verwenden. In CI wird der Puppeteer-Browser genutzt. Der GitHub-Workflow veröffentlicht nur QA-Artefakte, kein Deployment.

## Produktivwechsel

Cloudflare Workers Builds verwendet folgende **Build-Einstellungen** (nicht Worker-Laufzeitvariablen):

- `NODE_VERSION=24.18.0`: bereits vorhandene Version des Hosting-Buildimages, nur für dessen Initialisierung.
- `SKIP_DEPENDENCY_INSTALL=1`: verhindert die automatische Paketinstallation mit dieser Initialisierungsversion.
- Build command: leer.
- Deploy command: `bash scripts/cloudflare-deploy.sh deploy`.
- Non-production branch deploy command: `bash scripts/cloudflare-deploy.sh preview`.

Das Skript lädt Node **24.22.1** direkt von `nodejs.org`, prüft die fest hinterlegte SHA-256-Prüfsumme und startet erst danach `npm ci` und den versionierten Wrangler. Somit laufen Paketinstallation, Shop-Build und Deployment auf der aktuellen Sicherheitsversion. Die Hosting-Installation dieser neuen Node-Version brach am 21.10.2026 vor dem Build ab; dieser Bootstrap umgeht den fehlerhaften Installer. `verify` prüft denselben Download und die tatsächliche Laufzeit in GitHub CI ohne Veröffentlichung. Bei einem Node-Update müssen `.node-version`, Skriptversion und offizielle Linux-x64-Prüfsumme gemeinsam aktualisiert werden.

Die konfigurierte Domainzuordnung für `note-fragrances.de` und `www.note-fragrances.de` vor dem tatsächlichen Wechsel im Dashboard kontrollieren. Der Secret-Wert gehört nicht in `wrangler.jsonc`, Git oder den Browser-Build.

Vor einer Veröffentlichung die vorhandene automatische Kopplung von Branch-Pushes an Workers Builds prüfen. Ein Trockenlauf ist erfolgreich getestet; er setzt keine Secrets und aktiviert keine Domain. Für das Release Frontend-/Backend-Commit gemeinsam dokumentieren und nach der Aktivierung Login, Kundenkonto, Warenkorb, Checkout und Sicherheitsheader über die tatsächliche Domain prüfen.
