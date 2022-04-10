const fs = require('fs');
const { USAGI_CONSTANT } = require('./usagi.constants');
const pathToOutput = `${USAGI_CONSTANT.BOT_DUMP_PATH}\\output.txt`;
const pathToFinalFile = `${USAGI_CONSTANT.BOT_DUMP_PATH}\\ice_mapped_list.json`;

exports.processOutput = function() {
    if (fs.existsSync(pathToOutput)) {
        let finalFileList = [];
        let regex = new RegExp('.*pso2_bin\\\\data\\\\(?:win32|win32reboot)\\\\([A-Za-z0-9]{32})_ext.*(\\\\\\w{0,}\\.\\w{0,5})');
        let readString = fs.readFileSync(pathToOutput, 'utf-8');
        let fileList = readString.split('\n');
        if (fileList.length > 0) {
            fileList.forEach((line) => {
                let executedLineResult = regex.exec(line);
                if (executedLineResult == null) {
                    return;
                }
                finalFileList.push(`${executedLineResult[1]}${executedLineResult[2]}`)
            })
        }
        fs.writeFileSync(pathToFinalFile, JSON.stringify(finalFileList, null, 4), 'utf8');
        fs.unlinkSync(pathToOutput);
    }
    return;
}