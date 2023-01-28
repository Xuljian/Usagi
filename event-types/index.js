const fs = require('fs');
let EVENT_TYPES = {};

// .js1 basically says that the event-type file is not ready
fs.readdirSync(__dirname)
    .filter(file => {
        return file.indexOf('index') == -1 && file.indexOf('.js') > -1 && file.indexOf('.js1') === -1;
    }).map(file => {
        return file.substring(0, file.indexOf('.js'));
    }).forEach(file => {
        EVENT_TYPES[file] = require(__dirname + '/' + file + '.js');
    })

exports.EVENT_TYPES = EVENT_TYPES;