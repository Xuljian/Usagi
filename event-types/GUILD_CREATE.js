const tempRepositoryFunc = require('../repository');
const realTimeRepository = tempRepositoryFunc.realTimeRepository;

exports.process = function(data) {
    var usableData = data.d;
    if (realTimeRepository.guilds[usableData.id] == null) {
        realTimeRepository.guilds[usableData.id] = usableData;
    }
}