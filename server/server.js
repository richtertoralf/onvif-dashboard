const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

// Middleware für statische Dateien (CSS, JS, Bilder)
app.use(express.static(path.join(__dirname, '../client')));

// Behandle Anfragen für socket.io
app.get('/socket.io/*', (req, res) => {
    const socketIOPath = path.join(__dirname, '../client/js/socket.io.js');
    fs.readFile(socketIOPath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.end(data, 'utf-8');
        }
    });
});

// Beispielroute für die Index-Datei
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

// Socket.IO-Logik hier hinzufügen
io.on('connection', (socket) => {
    console.log('A user connected');

});

const cameraInfoPath = path.join(__dirname, 'data/cameraInfo.json');

// Überprüfe die Existenz der Datei und erstelle sie, wenn sie nicht existiert
if (!fs.existsSync(cameraInfoPath)) {
    fs.writeFileSync(cameraInfoPath, '[]', 'utf-8');
}


// Überwache Änderungen an der Datei cameraInfo.json
fs.watchFile(cameraInfoPath, (curr, prev) => {
    // Datei wurde geändert, lies die Daten und sende sie an alle Clients
    fs.readFile(cameraInfoPath, 'utf-8', (err, data) => {
        if (!err) {
            try {
                const cameraInfoArray = JSON.parse(data);
                console.log('Parsed cameraInfo.json:', cameraInfoArray);
                io.emit('cameraInfo', cameraInfoArray);
            } catch (parseError) {
                console.error('Error parsing cameraInfo.json:', parseError);
            }
        } else {
            console.error('Error reading cameraInfo.json:', err);
        }
    });
});

// Lies die Daten beim Start des Servers und sende sie an alle Clients
fs.readFile(cameraInfoPath, 'utf-8', (err, data) => {
    if (!err) {
        try {
            const cameraInfoArray = JSON.parse(data);
            // console.log('Initial cameraInfo.json:', cameraInfoArray);
            io.emit('cameraInfo', cameraInfoArray);
        } catch (parseError) {
            console.error('Error parsing initial cameraInfo.json:', parseError);
        }
    } else {
        console.error('Error reading initial cameraInfo.json:', err);
    }
});
