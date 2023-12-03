const onvif = require('onvif');
const fs = require('fs').promises;

/**
 * Pfad zur Datei, in der Kamerainformationen gespeichert werden.
 * @type {string}
 */
const dataFilePath = './server/data/cameraInfo.json';

/**
 * Funktion zum Extrahieren der IP-Adresse aus dem ersten xaddr in einem Kameraobjekt.
 * @param {Object} camera - Kameraobjekt
 * @returns {string} - Die IP-Adresse oder 'N/A', wenn nicht verfügbar
 */
function extractIpAddress(camera) {
    const xaddrs = camera.xaddrs;

    if (Array.isArray(xaddrs) && xaddrs.length > 0) {
        const xaddr = xaddrs[0];
        if (typeof xaddr === 'object' && xaddr.host) {
            return xaddr.host;
        } else {
            console.error('Unexpected xaddrs value:', xaddr);
            return 'N/A';
        }
    } else {
        console.error('xaddrs is not defined or empty:', xaddrs);
        return 'N/A';
    }
}


/**
 * Funktion zum Aktualisieren der Kamerainformationen.
 * @async
 * @function
 */
async function getCameraInfoArray() {
    try {
        // Kameradaten über ONVIF entdecken
        const cams = await discoverOnvifDevices();
        console.log('Discovered Cameras:', cams);

        // Vorhandene Daten aus der Datei lesen oder Datei erstellen, wenn nicht vorhanden
        let existingData = { cameraInfoArray: [] };
        try {
            const data = await fs.readFile(dataFilePath, 'utf8');
            existingData = JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                await fs.writeFile(dataFilePath, '{"cameraInfoArray": []}', 'utf8');
            } else {
                console.error('Error reading existing data:', error);
            }
        }

        // Aktualisierte Kameradaten vorbereiten
        const updatedCameraInfoArray = [];

        // Neue Kameras mit vorhandenen vergleichen und aktualisieren
        for (const newCamera of cams) {
            const foundCameraIndex = findCameraIndex(existingData.cameraInfoArray, extractIpAddress(newCamera));

            if (foundCameraIndex !== -1) {
                const updatedCamera = createOrUpdateCameraData(existingData.cameraInfoArray[foundCameraIndex], newCamera);
                updatedCameraInfoArray.push(updatedCamera);
            } else {
                const rtspStreamUri = await getRtspStreamUri(newCamera);
                const newCameraData = createOrUpdateCameraData(null, newCamera, rtspStreamUri);
                updatedCameraInfoArray.push(newCameraData);
            }
        }

        // Nur schreiben, wenn neue Kameras gefunden wurden
        if (updatedCameraInfoArray.length > 0) {
            // Aktualisierte Kameradaten in die Datei schreiben
            await fs.writeFile(dataFilePath, JSON.stringify({ cameraInfoArray: updatedCameraInfoArray }, null, 2));
            console.log('Camera Info Array updated and saved to file.');
        } else {
            console.log('No new cameras found. File not updated.');
        }

    } catch (error) {
        console.error('Error during periodic update:', error);
    }
}

/**
 * Funktion zum Suchen des Index einer Kamera in den vorhandenen Daten.
 * @param {Array} existingData - Vorhandene Kameradaten
 * @param {string} ipAddress - IP-Adresse der zu suchenden Kamera
 * @returns {number} - Index der Kamera in den vorhandenen Daten oder -1, wenn nicht gefunden
 */
function findCameraIndex(existingData, ipAddress) {
    return existingData.findIndex((camera) => extractIpAddress(camera) === ipAddress);
}

/**
 * Funktion zum Erstellen oder Aktualisieren von Kameradaten.
 * @param {Object} existingCamera - Vorhandene Kameradaten (kann null sein)
 * @param {Object} newCamera - Neue Kameradaten
 * @param {string} [rtspStreamUri] - RTSP-Stream-URI der Kamera (optional, wird nur für neue Kameras verwendet)
 * @returns {Object} - Erstellte oder aktualisierte Kameradaten
 */
function createOrUpdateCameraData(existingCamera, newCamera, rtspStreamUri) {
    const cameraData = {
        hostname: newCamera.hostname,
        activeSource: {
            sourceToken: newCamera.activeSource.sourceToken,
            profileToken: newCamera.activeSource.profileToken,
            encoding: newCamera.activeSource.encoding,
            resolution: {
                width: newCamera.activeSource.width || null,
                height: newCamera.activeSource.height || null,
            },
            fps: newCamera.activeSource.fps,
            bitrate: newCamera.activeSource.bitrate,
        },
        
        rtspStreamUri: rtspStreamUri || (existingCamera && existingCamera.rtspStreamUri) || null,
        xaddrHost: newCamera.xaddrs[0].host || null,
        pingResult: existingCamera && existingCamera.pingResult !== undefined ? existingCamera.pingResult : undefined,
    };

    return cameraData;
}

/**
 * Funktion zum Entdecken von ONVIF-Geräten.
 * @async
 * @returns {Promise<Array>} - Array von ONVIF-Geräten
 */
async function discoverOnvifDevices() {
    return new Promise((resolve, reject) => {
        onvif.Discovery.probe((err, cams) => {
            if (err) {
                reject(err);
            } else {
                resolve(cams);
            }
        });
    });
}

/**
 * Funktion zum Abrufen der RTSP-Stream-URI einer Kamera.
 * @async
 * @param {Object} camera - Kameraobjekt
 * @returns {Promise<string>} - RTSP-Stream-URI
 */
async function getRtspStreamUri(camera) {
    return new Promise((resolve, reject) => {
        camera.getStreamUri({ protocol: 'RTSP' }, (err, stream) => {
            if (!err) {
                resolve(stream.uri);
            } else {
                console.error('Error getting RTSP Stream URI:', err);
                reject(err);
            }
        });
    });
}

// Funktion alle 2 Minuten ausführen
setInterval(getCameraInfoArray, 5 * 60 * 1000);
