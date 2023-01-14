const pso2search = require('./pso2search');

exports.process = function(data, args) {
    return pso2search.process(data, args, true);
}