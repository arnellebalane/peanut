const path = require('path');
const nconf = require('nconf');


nconf
    .argv()
    .env()
    .file({ file: path.join(__dirname, 'config.json') })
    .defaults({
        PORT: 3000
    });


module.exports = nconf;
