const path = require('path');
const express = require('express');
const morgan = require('morgan');
const winston = require('winston');
const consolidate = require('consolidate');
const config = require('./config');

const app = express();

app.engine('html', consolidate.nunjucks);
app.set('views', path.join(__dirname, 'views'));

app.use(morgan('dev'));
app.use('/static', express.static(path.join(__dirname, 'static')));

app.get('/', (req, res) => res.render('index.html'));

app.listen(config.get('PORT'),
    () => winston.info(`Server is now running at port ${config.get('PORT')}`));
