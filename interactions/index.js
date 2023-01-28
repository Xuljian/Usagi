const fs = require('fs');

let USAGI_INTERACTIONS = {}

fs.readdirSync(__dirname)
    .filter(file => {
        return file.indexOf('index') == -1 && file.indexOf('.js') > -1 && file.indexOf('.under-construction.js') === -1;
    }).map(file => {
        return file.substring(0, file.indexOf('.js'));
    }).forEach(file => {
        USAGI_INTERACTIONS[file] = require(__dirname + '/' + file + '.js');
    })

exports.USAGI_INTERACTIONS = USAGI_INTERACTIONS;