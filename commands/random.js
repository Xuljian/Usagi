const restActions = require('../rest-actions');
const getTag = require('../utils/common').getTag;
const usagiConstants = require("../usagi.constants").USAGI_CONSTANTS;

const prefix = usagiConstants.BOT_DATA.COMMAND_PREFIX;

exports.process = function(data, args) {
    let splitArgs = args.split(' ');
    if (args == null || args === '' || args === '?') {
        restActions.sendMessage({
            interactionId: data.id,
            interactionToken: data.token,
            guildId: data.guild_id,
            channelId: data.channel_id,
            message: `${getTag(data.author?.id)} The command is "${prefix}random <min> <max>" where min and max are inclusive. It will not work if both are not given`.trim()
        });
        return true;
    } else if (/\d+/.exec(splitArgs[0]) != null && /\d+/.exec(splitArgs[1]) != null) {
        let splitArgs = args.split(' ');

        let low = parseInt(splitArgs[0]);
        let high = parseInt(splitArgs[1]);
        let randomValue = Math.floor(Math.random() * (high - low + 1) + low);

        restActions.sendMessage({
            interactionId: data.id,
            interactionToken: data.token,
            guildId: data.guild_id,
            channelId: data.channel_id,
            message: `${getTag(data.author?.id)} Your settings: minimum: ${splitArgs[0]}, maximum ${splitArgs[1]}.\nYou rolled ${randomValue}`.trim()
        });
        return true;
    }
    return false;
}

exports.processOptions = function(data) {
    let argString = null;
    if (data.data?.options != null) {
        let options = data.data.options;
        if (options.length == 2) {
            argString = " ";
            options.forEach((o) => {
                if (o.name === "min") {
                    argString = o.value + argString;
                } else if (o.name === "max") {
                    argString = argString + o.value;
                }
            })
        }
    }
    return argString;
}