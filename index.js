const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const morgan = require('morgan');
const winston = require('winston');
const consolidate = require('consolidate');
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
const clients = [];

io.on('connection', (socket) => {
    clients.push(socket);
});
