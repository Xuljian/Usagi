const { USAGI_COMMANDS } = require('../commands');
const usagiConstants = require("../usagi.constants").USAGI_CONSTANTS;

exports.process = async function(data) {
    let usableData = data.d;
    if (usableData.guild_id != null) {
        if (usableData.member?.user?.id === usagiConstants.BOT_DATA.CLIENT_ID) {
            return;
        }
        await matchInteraction(usableData);
    }
}

 let matchInteraction = async function (data) {
    let command = data.data.name;
    if (USAGI_COMMANDS[command.toLowerCase()] == null) {
        USAGI_COMMANDS['help'].process(data);
    } else {
        let optionsProcessor = USAGI_COMMANDS[command.toLowerCase()].processOptions;
        let args = null;
        if (optionsProcessor != null) {
            args = optionsProcessor(data);
        }
        await USAGI_COMMANDS[command.toLowerCase()].process(data, args);
    }
}