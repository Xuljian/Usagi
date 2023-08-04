const restActions = require('../rest-actions');
const { log } = require('../utils/logger');
const getTag = require('../utils/common').getTag;
const pso2Modules = require('../utils/pso2/pso2-modules');
const usagiConstants = require("../usagi.constants").USAGI_CONSTANTS;

const prefix = usagiConstants.BOT_DATA.COMMAND_PREFIX;

const FormData = require("form-data");

exports.process = function(data, args, exact) {
    if (!pso2Modules.pso2ModulesReady) {
        restActions.sendMessage({
            guildId: data.guild_id,
            channelId: data.channel_id,
            message: `${getTag(data.author?.id)} This command is not ready yet`.trim()
        });
        return true;
    }

    if (args == null || args === '' || args === '?') {
        let description = getPSO2SearchDescription(exact);
        restActions.sendMessage({
            guildId: data.guild_id,
            channelId: data.channel_id,
            embed: {
                color: usagiConstants.BOT_DATA.EMBED_COLOR_HEX,
                description: description
            }
        });
    } else {
        let argArr = args.split(" ");
        let cmlName = argArr[0];
        let ext = null;
        let fix = false;
        if (argArr.length > 1) {
            ext = argArr[1];
            if(argArr.length > 2 && argArr[2].toLowerCase() == 'fix') {
                fix = true;
            }
        }
        pso2Modules.getPayload(cmlName, ext, exact, fix, (payload) => {
            if (payload == null) {
                restActions.sendMessage({
                    guildId: data.guild_id,
                    channelId: data.channel_id,
                    messageReference: {
                        channel_id: data.channel_id,
                        message_id: data.id,
                        guild_id: data.guild_id
                    },
                    message: `${getTag(data.author?.id)} Can't find the file sorry :(`.trim()
                });
            } else if (payload === 'not null') {
                restActions.sendMessage({
                    guildId: data.guild_id,
                    channelId: data.channel_id,
                    messageReference: {
                        channel_id: data.channel_id,
                        message_id: data.id,
                        guild_id: data.guild_id
                    },
                    message: `${getTag(data.author?.id)} This command is out of order, I have pinged my master. Sorry for the inconvenience :(`.trim()
                });
            } else {
                let messageData = {
                    channelId: data.channel_id,
                    guildId: data.guild_id,
                }
                let content = new FormData();
                messageData.content = content;
                content.append('payload_json', JSON.stringify({
                    message_reference: {
                        channel_id: data.channel_id,
                        message_id: data.id,
                        guild_id: data.guild_id
                    }
                }));
                content.append(payload.filename, payload.buffer, {
                    filename: `${payload.filename}.${payload.extension}`
                });
                restActions.sendMessageComplex(messageData);
            }
        });
    }
    return true;
}

exports.end = function() {
    log("Ending pso2 related modules");
    pso2Modules.endPSO2();
}

let getPSO2SearchDescription = function(exact) {
    if(!exact)
        return "**Using pso2search**\n\n" +
                `\`\`${prefix}pso2search <npc cml name> <ext> <fix>\`\`\n\n` +
                "Visit this link https://docs.google.com/spreadsheets/d/1GQwG49iYM1sgJhyAU5AWP-gboemzfIZjBGjTGEZSET4/edit#gid=126227794\n" +
                "In the spreadsheet find the NPC you wish to get the files for and replace <npc cml name> with the name in the CML column of the spreadsheet when using this command\n\n" +
                "The ext is basically the character file you wish to convert to. (Applicable for CML files only)\n" +
                "The <fix> is for whether or not I need to fix the NA height issue, if that parameter is not provided I will give you the default height (just a 'fix' will be sufficient)\n" +
                "\`\`\`List of ext supported:\nfhp for female human\nfnp for female newman\n" + 
                "fcp for female cast\n" + 
                "fdp for female deuman\n" + 
                "mhp for male human\n" + 
                "mnp for male newman\n" +
                "mcp for male cast\n" + 
                "mdp for male deuman\n" +
                "default for the intended gender and race\`\`\`\n" +
                "PS: If ext provided don't match any of the given ones above, the CML will be given.\n\n" +
                `Example: \`\`${prefix}pso2search npc_04 fdp\`\`\n` +
                "The example above will provide you with the npc file of Matoi for female deuman"
    else
        return "**Using pso2file**\n\n" +
                `\`\`${prefix}pso2file <extracted full filename> <ext> <fix>\`\`\n\n` +
                "Use this only when you know the filename exactly, otherwise use pso2search\n\n" +
                "The ext is basically the character file you wish to convert to. (Applicable for CML files only)\n" +
                "The <fix> is for whether or not I need to fix the NA height issue, if that parameter is not provided I will give you the default height (just a 'fix' will be sufficient)\n" +
                "\`\`\`List of ext supported:\nfhp for female human\nfnp for female newman\n" + 
                "fcp for female cast\n" + 
                "fdp for female deuman\n" + 
                "mhp for male human\n" + 
                "mnp for male newman\n" +
                "mcp for male cast\n" + 
                "mdp for male deuman\n" +
                "default for the intended gender and race\`\`\`\n" +
                "PS: If ext provided don't match any of the given ones above, the CML will be given.\n\n" +
                `Example: \`\`${prefix}pso2file np_npc_91.cml fhp\`\`\n` +
                "The example above will provide you with the npc file of Io for female human"
}