const { exec } = require('child_process');
const fs = require('fs').promises;

const dataFilePath = './server/data/cameraInfo.json';

let fileLock = false; // Variable, um den Dateizugriff zu steuern

/**
 * Führt je vier Pings auf den angegebenen Host aus und gibt den Durchschnitts-Ping-Zeitwert zurück.
 *
 * @param {string} xaddrHost - Der Host, auf den der Ping ausgeführt werden soll.
 * @returns {Promise<number|null>} - Ein Promise, das den Durchschnitts-Ping-Zeitwert oder null bei einem Fehler zurückgibt.
 */
async function pingHost(xaddrHost) {
    return new Promise((resolve, reject) => {
        // -c 4 bedeutet vier Pings
        exec(`ping -c 4 ${xaddrHost}`, (error, stdout, stderr) => {
            if (error) {
                resolve(null);
            } else {
                const lines = stdout.split('\n');
                const statsLine = lines[lines.length - 2];
                const stats = statsLine.match(/min\/avg\/max\/mdev = .+?\/(.+?)\/.+?\/.+? ms/);
                if (stats) {
                    const avg = parseFloat(stats[1]);
                    resolve(avg);
                } else {
                    resolve(null);
                }
            }
        });
    });
}

/**
 * Pingt die im File cameraInfo.json angegebenen Hosts an und aktualisiert die Datei mit den Ping-Ergebnissen.
 */
async function pingXaddrHosts() {
    try {
        // Überprüfe, ob die Datei bereits gesperrt ist
        if (fileLock) {
            console.log('File is already locked. Skipping ping operation.');
            return;
        }

        // Sperre die Datei für Lese- und Schreibvorgänge
        fileLock = true;

        const cameraInfoData = await fs.readFile(dataFilePath, 'utf8');
        const cameraInfo = JSON.parse(cameraInfoData);

        // Sofort nach dem Lesen freigeben
        fileLock = false;

        for (const camera of cameraInfo.cameraInfoArray) {
            const xaddrHost = camera.xaddrHost.split(':')[0]; // Remove port
            const result = await pingHost(xaddrHost);
            // console.log(`xaddrHost ${xaddrHost}: ${result}`);

            // Warte, bis die Datei freigegeben ist
            while (fileLock) {
                await new Promise(resolve => setTimeout(resolve, 100)); // Warte 100 Millisekunden
            }

            // Sperre die Datei erneut für den Schreibvorgang
            fileLock = true;

            // Füge das Ping-Ergebnis zur Kamera hinzu
            camera.pingResult = result;

            // Aktualisiere die Datei mit den Ping-Ergebnissen
            await fs.writeFile(dataFilePath, JSON.stringify(cameraInfo, null, 2));

            // Freigeben, wenn der Schreibvorgang abgeschlossen ist
            fileLock = false;
        }
    } catch (error) {
        console.error('Error reading or writing cameraInfo file:', error);
    }
}

/**
 * Pingt die Hosts alle 2 Minuten (300.000 Millisekunden) an.
 */
setInterval(pingXaddrHosts, 1 * 60 * 1000);
