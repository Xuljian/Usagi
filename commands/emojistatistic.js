const restActions = require('../rest-actions');

const tempRepositoryFunc = require('../repository');
const realTimeRepository = tempRepositoryFunc.realTimeRepository;

const usagiConstants = require("../usagi.constants").USAGI_CONSTANTS;
const prefix = usagiConstants.BOT_DATA.COMMAND_PREFIX;

exports.process = function(data, args) {
    let guildId = data.guild_id;

    if (args === '?') {
        let description = '**Using emojistatistic\n\n**' +
                            `\`\`${prefix}emojistatistic <option>\`\`\n\n` +
                            'This command is to show the emoji usage of this server!\n' +
                            '<option> option currently is only for reset or getting help (?).\n' +
                            'Example.\n' + 
                            `\`\`\`${prefix}emojistatistic\n` +
                            `${prefix}emojistatistic ?\n` +
                            `${prefix}emojistatistic reset\`\`\``
        restActions.sendMessage({
            interactionId: data.id,
            interactionToken: data.token,
            guildId: data.guild_id,
            channelId: data.channel_id,
            embed: {
                color: usagiConstants.BOT_DATA.EMBED_COLOR_HEX,
                description: description
            }
        });
        return true;
    }

    if (realTimeRepository.emojiUsage[guildId] == null) {
        return;
    }

    if (args === "reset") {
        resetStats(guildId);

        restActions.sendMessage({
            interactionId: data.id,
            interactionToken: data.token,
            guildId: data.guild_id,
            channelId: data.channel_id,
            messageReference: {
                channel_id: data.channel_id,
                message_id: data.id,
                guild_id: data.guild_id
            },
            message: `Statistic successfully resetted`
        });
        return;
    }

    let guild = realTimeRepository.guilds[guildId];
    let actualMessage = null;

    Object.keys(realTimeRepository.emojiUsage[guildId]).forEach(key => {
        let reg = /:.*:(.*)/
        let res = reg.exec(key);
        if (res == null) {
            return;
        }

        let idx = guild.emojis.findIndex(emoji => emoji.id == res[1]);
        if (idx > -1) {
            actualMessage = (actualMessage || "") + `<${key}> - ${realTimeRepository.emojiUsage[guildId][key]}\n`
        } else {
            delete realTimeRepository.emojiUsage[guildId][key]
        }
    })

    actualMessage = actualMessage || "No emojis statistic counted yet, try again next time.";

    restActions.sendMessage({
        interactionId: data.id,
        interactionToken: data.token,
        guildId: data.guild_id,
        channelId: data.channel_id,
        messageReference: {
            channel_id: data.channel_id,
            message_id: data.id,
            guild_id: data.guild_id
        },
        message: `${actualMessage}`
    });

    return true;
}

let resetStats = function(guildId) {
    let guildStat = realTimeRepository.emojiUsage[guildId]
    Object.keys(guildStat).forEach(key => {
        delete realTimeRepository.emojiUsage[guildId][key];
    })
}