const restActions = require('../rest-actions');

exports.process = function(data, args) {
    restActions.sendMessage({
        interactionId: data.id,
        interactionToken: data.token,
        guildId: data.guild_id,
        channelId: data.channel_id,
        isEphemeral: true,
        message: "Message sent"
    });
    restActions.sendMessage({
        guildId: data.guild_id,
        channelId: data.channel_id,
        message: args
    });
    return true;
}