const fs = require('fs');
let EVENT_TYPES = {};

fs.readdir(__dirname, (err, files) => {
    if (err) {
        console.log(error);
    }

    files.filter(file => {
        return file.indexOf('index') == -1 && file.indexOf('.js') > -1;
    }).map(file => {
        return file.substring(0, file.indexOf('.js'));
    }).forEach(file => {
        EVENT_TYPES[file] = require(__dirname + '/' + file + '.js');
    })
})

exports.EVENT_TYPES = EVENT_TYPES;