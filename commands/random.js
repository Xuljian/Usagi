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
            embed: {
                color: usagiConstants.BOT_DATA.EMBED_COLOR_HEX,
                description: '**Using Random\n\n**' +
                            `\`\`${prefix}random <min> <max>\`\`\n\n` +
                            'This command is for generating a random number where min and max are inclusive.\n' +
                            'It will not work if both are not given!\n' +
                            '<min> the minimum number that I can roll.\n' +
                            '<max> the maximum number that I can roll.\n' +
                            'Again, they are both inclusive\n\n' +
                            'Example.\n' + 
                            `\`\`\`${prefix}random 0 3\`\`\``
            }
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