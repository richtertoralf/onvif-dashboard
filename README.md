# onvif-dashboard
Dashboard zur Anzeige von onvif-Kamerainformationen
## Projektname: Camera Dashboard

<img src="https://github.com/richtertoralf/onvif-dashboard/blob/7f1aa7f6e301eab8770972953998476c9e7856c6/camera-dashboard.jpg" style="width:60%;">

## Was geht hier ab?
Du hast hier ein Camera Dashboard-Projekt, in einem frühen Entwurfsstadium, vor dir. Das Dashboard zeigt dir Echtzeitinformationen von Kameras an. Das Projekt passiert mit einem Node.js-Server und Socket.IO, die die Informationen fast in Echtzeit an deinen Browser weiterreichen. Die Kameradaten kommen aus einer JSON-Datei, die von einem Server-Skript ständig auf dem Laufenden gehalten wird. Das Dashboard ist mit HTML, CSS und JavaScript gemacht.

## Was kann das Ding?

Zeigt dir wichtige Kamerainfos an, wie Hostname, Auflösung, FPS, Bitrate, RTSP Stream URI, xaddrHost (IP-Adresse) und Ping-Ergebnisse.
Updatet die Kameradaten in Echtzeit über Socket.IO.
Passt sich automatisch an verschiedene Bildschirmgrößen an, ohne dass du dich mit Media Queries rumschlagen musst.
Nutzt Grid-Layout, um die Kamerainfos anzuordnen.
Was wird hier eingesetzt?

- Node.js
- Socket.IO
- HTML
- CSS

## Wie benutze ich dieses Teil?

- Klone das Repository auf deinen Rechner.
- Installiere die nötigen Node.js-Module mit npm install.
- Starte den Server und die Hilfsprozesse:
* node server/pingXaddrHosts.js
* node server/onvifDiscovery.js
* node server/server.js
- Öffne deinen Browser und greif auf das Dashboard über http://localhost:3001 oder http://<ip-deines-servers>:3001 zu.
- Tipp: Stell sicher, dass du Node.js auf deinem Server-System hast, bevor du das Projekt startest. Wenn nicht, hol es dir hier: nodejs.org.
