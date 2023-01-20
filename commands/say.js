const restActions = require('../rest-actions');
const { pickOne } = require('../utils/common');

const alternateReplies = [
    "No. :<",
    "\\*Loafing around\\*",
    "\\*Ignoring you\\*",
    "I don't wanna :)",
    "xP"
]

exports.process = function(data, args) {
    let troll = false;
    if (Math.random() >= 0.8)
        troll = true;
    
    if (data.token != null || (troll && data.token == null))
    restActions.sendMessage({
        interactionId: data.id,
        interactionToken: data.token,
        guildId: data.guild_id,
        channelId: data.channel_id,
        isEphemeral: true,
        message: troll ? pickOne(alternateReplies) : "Message sent"
    });
    
    if (!troll)
        restActions.sendMessage({
            guildId: data.guild_id,
            channelId: data.channel_id,
            message: args
        });

    return true;
}