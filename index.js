const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const morgan = require('morgan');
const winston = require('winston');
const consolidate = require('consolidate');
const uuid = require('uuid');
const config = require('./config');

const app = express();

app.engine('html', consolidate.nunjucks);
app.set('views', path.join(__dirname, 'views'));

app.use(morgan('dev'));
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/socketio', express.static(
    path.join(__dirname, 'node_modules', 'socket.io-client', 'dist')));

app.get('/', (req, res) => res.render('index.html'));

const server = http.createServer(app);
server.listen(config.get('PORT'),
    () => winston.info(`Server is now running at port ${config.get('PORT')}`));

const io = socketio(server);
const clients = {};

io.on('connection', (socket) => {
    const socketId = uuid();
    clients[socketId] = socket;

    if (Object.keys(clients).length > 1) {
        for (let key in clients) {
            if (key !== socketId) {
                socket.emit('peerconnect', key);
            }
        }
    }

    socket.on('peeroffer', ({ peerId, data }) => {
        clients[peerId].emit('peeroffer', { peerId: socketId, data });
    });

    socket.on('peeranswer', ({ peerId, data }) => {
        clients[peerId].emit('peeranswer', { peerId: socketId, data });
    });

    socket.on('peericecandidate', ({ peerId, data }) => {
        clients[peerId].emit('peericecandidate', { peerId: socketId, data });
    });

    socket.on('disconnect', () => {
        delete clients[socketId];
        for (let key in clients) {
            if (key in clients) {
                clients[key].emit('peerdisconnect', socketId);
            }
        }
    });
});
