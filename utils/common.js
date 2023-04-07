const tempRepositoryFunc = require('../repository');
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

// function will pick 1 and return out of all items in the arr provided
exports.pickOne = function(arr) {
    let low = 0;
    let high = arr.length - 1;
    let randomValue = Math.floor(Math.random() * (high - low + 1) + low);
    return arr[randomValue];
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