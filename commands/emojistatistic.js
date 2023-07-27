const restActions = require('../rest-actions');

const tempRepositoryFunc = require('../repository');
const { getTag } = require('../utils/common');
const realTimeRepository = tempRepositoryFunc.realTimeRepository;

exports.process = function(data) {
    let guildId = data.guild_id;

    if (realTimeRepository.emojiUsage[guildId] == null) {
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
            actualMessage = (actualMessage || "") + `<${key}>: ${realTimeRepository.emojiUsage[guildId][key]}\n`
        } else {
            delete realTimeRepository.emojiUsage[guildId][key]
        }
    })

    restActions.sendMessage({
        interactionId: data.id,
        interactionToken: data.token,
        guildId: data.guild_id,
        channelId: data.channel_id,
        message: `${getTag(data.author?.id)}\n${actualMessage}`
    });

    return true;
}