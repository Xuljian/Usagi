const tempRepositoryFunc = require('../temp-repository');
const realTimeRepository = tempRepositoryFunc.realTimeRepository;

exports.getTag = function(authorId) {
    return `${authorId ? '<@!' + authorId + '>' : ''}`;
}

exports.checkUILoggingIgnore = function (id) {
    let result = realTimeRepository.channelIgnore.findIndex(o => {
        return o == id;
    })
    return result >= 0;
}

const validMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
]

const mimeMapping = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp'
}

exports.validMimes = validMimes;
exports.mimeMapping = mimeMapping;