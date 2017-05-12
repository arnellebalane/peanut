const path = require('path');
const nconf = require('nconf');

nconf
    .argv()
    .env()
    .file('secrets', path.join(__dirname, 'secrets.json'))
    .file('config', path.join(__dirname, 'config.json'))
    .defaults({
        PORT: 3000
    });

module.exports = nconf;
