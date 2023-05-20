const tempRepositoryFunc = require('../repository');
const realTimeRepository = tempRepositoryFunc.realTimeRepository;

exports.getTag = function(authorId) {
    return `${authorId ? '<@!' + authorId + '>' : ''}`;
}

exports.generateString = function(length) {
    let str = "";
    let internalLength = length || 6;
    const all = ["qwertyuiopasdfghjklzxcvbnm", "QWERTYUIOPASDFGHJKLZXCVBNM", "1234567890"];

    for (let x = 0; x != internalLength; x++) {
        let choice = all[generateRandom(0, 2)];
        str += choice.charAt(generateRandom(0, choice.length - 1));
    }
    return str;
}

exports.checkUILoggingIgnore = function (id) {
    let result = realTimeRepository.channelIgnore.findIndex(o => {
        return o == id;
    })
    return result >= 0;
}

let generateRandom = function(low, high) {
    let internalLow = low || 0;
    let internalHigh = high || 10;
    return Math.floor(Math.random() * (internalHigh - internalLow + 1) + internalLow);
}

// function will pick 1 and return out of all items in the arr provided
exports.pickOne = function(arr) {
    let low = 0;
    let high = arr.length - 1;
    let randomValue = generateRandom(low, high);
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