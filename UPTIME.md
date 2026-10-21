# Regelmäßige Backend-Prüfung

Der produktive Cloudflare-Worker ruft den öffentlichen Render-Endpunkt `/ready` alle zwölf Minuten direkt auf. Der Zeitplan steht in `wrangler.jsonc`; die Prüfung läuft im `scheduled`-Handler. Sie benötigt keinen eingeschalteten Wartungsrechner und keine Zugangsdaten.

Die Anfrage umgeht den Cache, folgt keinen Weiterleitungen und läuft nach 90 Sekunden aus. Nur HTTP 200 mit JSON `status: ready` gilt als Erfolg. Fehler lassen den Cron-Aufruf fehlschlagen und erscheinen als `backend-readiness` in Cloudflare. Bestellungen, Kundenkonten, Zahlungen und E-Mails werden nicht angesprochen. Der Render-Endpunkt prüft Datenbank und Produktkatalog.

Die Anfrage verwendet `redirect: manual` und lehnt alle Statuscodes außer 200 ab. Cloudflare Workers unterstützt `redirect: error` nicht. `npm test` prüft den produktiven Scheduled-Handler auch in der workerd-Laufzeit mit isolierten Antworten für Erfolg, Weiterleitung, Nichterreichbarkeit und ungültiges JSON; dabei werden keine echten externen Anfragen gesendet.

Cloudflare-Cron-Änderungen werden bei `wrangler deploy` übernommen; `wrangler versions upload` lädt nur eine Vorschau hoch. Nach Veröffentlichung den aktiven Trigger und mindestens einen echten Lauf in Cloudflare prüfen. Trigger können bis zu 15 Minuten zur Verteilung benötigen. Zeitplanänderungen im Repository pflegen, damit eine spätere Veröffentlichung sie beibehält.

Der bestehende GitHub-Uptime-Workflow bleibt eine zusätzliche Verfügbarkeitsprüfung. GitHub-Zeitpläne können verspätet ausgeführt werden und sind kein verlässlicher Taktgeber für das Wachhalten des Servers.

Dies ist eine bestmögliche Lösung innerhalb des kostenlosen Render-Tarifs. Render kann kostenlose Instanzen weiterhin neu starten oder bei ausgeschöpftem Workspace-Kontingent aussetzen. 750 Freistunden gelten gemeinsam pro Workspace und Monat; ein einzelner durchgehend laufender Dienst benötigt in einem Monat mit 31 Tagen 744 Stunden. Für einen verlässlich dauerhaft verfügbaren Shop ist ein kostenpflichtiger Render-Instanztyp die Anbieteroption; der Tarif wird durch diese Änderung nicht geändert.

Quellen: https://render.com/docs/free · https://developers.cloudflare.com/workers/configuration/cron-triggers/ · https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
