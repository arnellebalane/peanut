const path = require('path');
const express = require('express');
const eventsource = require('./eventsource');


const router = new express.Router();


router.use('/static', express.static(path.join(__dirname, '..', 'static')));


router.get('/', (req, res) => res.render('index.html'));


router.get('/eventsource', (req, res) => {
    if (req.headers.accept === 'text/event-stream') {
        const token = eventsource.subscribe(res);
        eventsource.message(token, { event: 'subscribe', data: token });
    } else {
        res.status(404).end();
    }
});


module.exports = router;
