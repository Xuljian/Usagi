const tempRepositoryFunc = require('../temp-repository');
const realTimeRepository = tempRepositoryFunc.realTimeRepository;

exports.process = function(data) {
    var usableData = data.d;
    if (usableData.guilds.length > 0) {
        usableData.guilds.forEach((o) => {
            if (realTimeRepository.guilds[o.id] != null) {
                delete realTimeRepository.guilds[o.id];
            }
        });
    }
    realTimeRepository.hasInit = true;
}