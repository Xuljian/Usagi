const tempRepositoryFunc = require('../temp-repository');
var { messageLogs } = require('../message-logs-storage');
const usagiConstants = require("../usagi.constants").USAGI_CONSTANTS;
const restActions = require('../rest-actions');

exports.process = function(data) {
    var usableData = data.d;

    let channelId = tempRepositoryFunc.archiveChannel(usableData.guild_id);
    if (channelId == null) return;

    let messageIndex = messageLogs.findIndex(o => o.id == usableData.id);
    if (messageIndex == -1) return;

    let message = messageLogs[messageIndex];

    if (usableData.embeds != null && usableData.embeds.length > 0) {
        messageLogs.splice(messageIndex, 1);
        return;
    }

    let description = '**Edited message\n\n**' +
                        `Message: ${message.content}\n` +
                        `New Message: ${usableData.content}\n` +
                        `Go to message: https://discord.com/channels/${message.guild_id}/${message.channel_id}/${message.id}\n` +
                        `By: <@${message.author.id}>\n` +
                        `Channel: <#${message.channel_id}>\n`
    restActions.sendMessage({
        guildId: usableData.guild_id,
        channelId: channelId,
        embed: {
            color: usagiConstants.BOT_DATA.EMBED_COLOR_HEX,
            description: description
        }
    });
    message.content = usableData.content;
}
            