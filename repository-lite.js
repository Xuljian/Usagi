const fs = require('fs');
const { USAGI_CONSTANTS } = require('./usagi.constants');

const dumpFilePath = USAGI_CONSTANTS.BOT_DUMP_PATH + '\\dump.txt';

const { log } = require('./utils/logger');

let realTimeRepository = {
    fileInit: false,
    debug: false
}

loopers = [
    timeoutChainer(checkDebug, 5000),
]

let checkDebug = async function() {
    let init = realTimeRepository.debug;
    if (fs.existsSync(USAGI_CONSTANTS.BOT_DUMP_PATH + "\\debug")) {
        realTimeRepository.debug = true;
    } else {
        realTimeRepository.debug = false;
    }
    if (init == realTimeRepository.debug) {
        if (realTimeRepository.debug) {
            log("Debug enabled");
        } else {
            log("Debug disabled");
        }
    }

    realTimeRepository.fileInit = true;
}

// currently not used
// in case if needed in future
var importFromFile = function () {
    fs.readFile(dumpFilePath, 'utf8', (error, content) => {
        if (error) {
            log(error);
            realTimeRepository.fileInit = true;
            return;
        }
        if ((content || '').trim() == '') {
            realTimeRepository.fileInit = true;
            return;
        }
        let repo = JSON.parse(b);
    })
}

exports.onClose = function() {
    if (loopers != null) {
        loopers.forEach(looper => { looper.stop = true; });
    }
}
exports.realTimeRepository = realTimeRepository;