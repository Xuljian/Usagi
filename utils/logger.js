const moment = require('moment');

exports.log = function(...args) {
    let currentTimeString = moment().utc().format('MMMM Do YYYY, hh:mm:ss:SSS');
    console.log(`${currentTimeString}: `, ...args);
}

exports.logTrace = function(...args) {
    let currentTimeString = moment().utc().format('MMMM Do YYYY, hh:mm:ss:SSS');
    console.trace(`${currentTimeString}: `, ...args);
}