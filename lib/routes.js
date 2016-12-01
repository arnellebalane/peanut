const path = require('path');
const express = require('express');
const eventsource = require('./event-source');


const router = new express.Router();


router.use('/static', express.static(path.join(__dirname, '..', 'static')));


router.get('/', (req, res) => res.render('index.html'));




module.exports = router;
