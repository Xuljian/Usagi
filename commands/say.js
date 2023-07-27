const restActions = require('../rest-actions');
const { pickOne } = require('../utils/common');
const usagiConstants = require("../usagi.constants").USAGI_CONSTANTS;
const prefix = usagiConstants.BOT_DATA.COMMAND_PREFIX;

const alternateReplies = [
    "No. :<",
    "\\*Loafing around\\*",
    "\\*Ignoring you\\*",
    "I don't wanna :)",
    "xP"
]

exports.process = function(data, args) {
    if (args == null || args === '' || args === '?') {
        restActions.sendMessage({
            interactionId: data.id,
            interactionToken: data.token,
            guildId: data.guild_id,
            channelId: data.channel_id,
            embed: {
                color: usagiConstants.BOT_DATA.EMBED_COLOR_HEX,
                description: '**Using Say\n\n**' +
                            `\`\`${prefix}say <things you want me to say>\`\`\n\n` +
                            'This command is to make me say stuff!\n' +
                            '<things you want me to say> is basically as it is.\n\n' +
                            'Example.\n' + 
                            `\`\`\`${prefix}say I am cute :)\`\`\`\n` +
                            `**It is up to me though if I want to say it or not, if I don't feel like it I won't say it ;P`
            }
        });
        return true;
    }

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