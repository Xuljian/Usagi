const tempRepositoryFunc = require('../repository');
const realTimeRepository = tempRepositoryFunc.realTimeRepository;

exports.process = function(data) {
    realTimeRepository.hasInit = true;
}