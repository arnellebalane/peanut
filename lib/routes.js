const path = require('path');
const express = require('express');
const callServer = require('./call-server');


const router = new express.Router();


router.use('/static', express.static(path.join(__dirname, '..', 'static')));


router.get('/', (req, res) => res.render('index.html'));


router.get('/call/:room?', (req, res) => {
    if (req.params.room && req.headers.accept === 'text/event-stream') {
        callServer.joinRoom(req.params.room, res);
    } else if (!req.params.room) {
        const room = callServer.createRoom();
        res.redirect(`/call/${room}`);
    } else {
        res.render('call.html');
    }
});


module.exports = router;
