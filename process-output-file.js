const fs = require('fs');
const { USAGI_CONSTANT } = require('./usagi.constants');
const pathToOutput = `${USAGI_CONSTANT.BOT_DUMP_PATH}\\output.txt`;
const pathToFinalFile = `${USAGI_CONSTANT.BOT_DUMP_PATH}\\ice_mapped_list.json`;

exports.processOutput = function() {
    if (fs.existsSync(pathToOutput)) {
        let finalFileList = [];
        let pathRegex = new RegExp('(?:win32|win32reboot)\\\\([A-Za-z0-9]{32}) ICE');
        let filenameRegex = new RegExp('(\\w{0,}\\.\\w{0,5})');
        let readString = fs.readFileSync(pathToOutput, 'utf-8');
        let fileList = readString.split('\r\n');
        if (fileList.length > 0) {
            let currentIce = null;
            fileList.forEach((line) => {
                line = line.trim();
                let executedLineResult = pathRegex.exec(line);
                if (executedLineResult != null) {
                    currentIce = executedLineResult[1];
                    return;
                } else {
                    executedLineResult = filenameRegex.exec(line);
                    if (executedLineResult != null && currentIce != null) {
                        finalFileList.push(`${currentIce}\\${executedLineResult[1]}`)
                    }
                }
            })
        }
        fs.writeFileSync(pathToFinalFile, JSON.stringify(finalFileList, null, 4), 'utf8');
        fs.unlinkSync(pathToOutput);
    }
    return;
}