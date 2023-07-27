const fs = require('fs');
const { log } = require('../utils/logger');

let USAGI_INTERACTIONS = {}

// .js1 basically says that the interaction file is not ready
fs.readdirSync(__dirname)
    .filter(file => {
        return file.indexOf('index') == -1 && file.indexOf('.js') > -1 && file.indexOf('.js1') === -1;
    }).map(file => {
        return file.substring(0, file.indexOf('.js'));
    }).forEach(file => {
        try {
            USAGI_INTERACTIONS[file] = require(__dirname + '/' + file + '.js');
        } catch {
            log("Unable to load interaction file " + file);
        }
    })

exports.USAGI_INTERACTIONS = USAGI_INTERACTIONS;