const restActions = require('../rest-actions');
const usagiConstants = require("../usagi.constants").USAGI_CONSTANTS;

const { AVAILABLE_SLASH_COMMANDS } = require('../slash-commands');

const prefix = usagiConstants.BOT_DATA.COMMAND_PREFIX;
const COMMANDS = require('./');

exports.process = function(usableData) {
    let description = '**Usagi bot commands\n\n**' +
                        'List of available commands!\n' +
                        '\`\`\`' + getCommands().join('\n') +
                        '\`\`\`\n' +
                        'All of them have a help page which can be brought up with just the command with no options.\n' +
                        'Except for disable and enable.\n' + 
                        'So I will explain it here.\n' +
                        '\`\`\`\*\*disable\*\* prevents me from talking in the executed server.\n\*\*enable\*\* negates the effect of disable. :)\`\`\`\n' +
                        'Example:\n' +
                        `\`\`\`${prefix}math\n\`\`\`\n` +
                        '\\*\\****For slash commands only the ' + AVAILABLE_SLASH_COMMANDS.join(", ") + ' are available at the moment***'
    restActions.sendMessage({
        interactionId: usableData.id,
        interactionToken: usableData.token,
        guildId: usableData.guild_id,
        channelId: usableData.channel_id,
        embed: {
            color: usagiConstants.BOT_DATA.EMBED_COLOR_HEX,
            description: description
        }
    });
    return true;
}

let getCommands = function() {
    return Object.keys(COMMANDS.USAGI_COMMANDS);
}