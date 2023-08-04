const restActions = require('../rest-actions');
const usagiConstants = require("../usagi.constants").USAGI_CONSTANTS;

const prefix = usagiConstants.BOT_DATA.COMMAND_PREFIX;

const cronJob = require('../utils/cron-job');
const { log } = require('../utils/logger');

exports.process = function(data, args) {
    if (args == null || args === '' || args === '?') {
        let description = '**Using Cron\n\n**' +
                            `\`\`${prefix}cron <action> <id> \"<cron expression>\" <message>\`\`\n\n` +
                            '**This command is for people who knows cron expressions.**\n\n' +
                            'This command is to register a recurring or a one time message using cron expression\n' +
                            'If you want to know more about building a cron expression visit this link:\n' +
                            'https://docs.oracle.com/cd/E12058_01/doc/doc.1014/e12030/cron_expressions.htm\n\n' +
                            '<action> can be one of 4 things.' +
                            '\`\`\`clear is to clear all crons in the channel, no other parameters required\n' +
                            'list is to list all cron in the current channel, use this to get the id, no other parameters required\n' +
                            'register is to register a new cron, the <cron expression> and <message> are required parameters\n' +
                            'unregister is to unregister a cron, the <id> is required (you can get the id from the list action)\`\`\`' +
                            '<id> only use this for unregister action. This is to tell me what cron you wish to unregister\n' +
                            '<cron expression> is basically the cron expression. Usable only with register action\n' +
                            '<message> is the recurring message you wish this bot to send when the time comes. Usable only with register action\n\n' + 
                            'Example for each command.\n' + 
                            `\`\`\`${prefix}cron list (id, cron expression and message is ignored)\n` +
                            `${prefix}cron clear (id, cron expression and message is ignored)\n` +
                            `${prefix}cron register "* * * * * *" hello (id is ignored, and the second and third parameter will be used as cron expression and message respectively)\n` + 
                            `${prefix}cron unregister 0 (cron expression and message is ignored, the 0 is the id)\`\`\``;
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
    } else {
        let argArr = args.split(" ");
        let action = argArr.shift();
        let parameters = argArr.join(" ");
        switch(action.toLowerCase()) {
            case 'list': {
                let crons = cronJob.getCronList(data.guild_id, data.channel_id);
                let description = '';
                if (crons.length == 0) {
                    description += 'No recurring messages registered'
                } else {
                    crons.forEach((cron, index) => {
                        description += `\*\***${index + 1}**. Id: ${cron.id}, Cron: ${cron.cron}, Channel: <#${cron.channelId}> Message: ${cron.message}\n`;
                    })
                }
                restActions.sendMessage({
                    interactionId: data.id,
                    interactionToken: data.token,
                    channelId: data.channel_id,
                    message: description,
                    messageReference: {
                        channel_id: data.channel_id,
                        message_id: data.id,
                        guild_id: data.guild_id
                    },
                });
                break;
            }
            case 'listmaster': {
                if (data.author?.id !== usagiConstants.BOT_DATA.OWNER_ID) {
                    restActions.sendMessage({
                        interactionId: data.id,
                        interactionToken: data.token,
                        guildId: data.guild_id,
                        channelId: data.channel_id,
                        message: `You got no access to this command`,
                        messageReference: {
                            channel_id: data.channel_id,
                            message_id: data.id,
                            guild_id: data.guild_id
                        },
                    });
                    return;
                }
                let crons = cronJob.getCronList(data.guildId);
                let description = '';
                if (crons.length == 0) {
                    description += 'No recurring messages registered'
                } else {
                    crons.forEach((cron, index) => {
                        description += `\*\***${index + 1}**. Id: ${cron.id}, Cron: ${cron.cron}, Channel: <#${cron.channelId}> Message: ${cron.message}\n`;
                    })
                }
                restActions.sendMessage({
                    interactionId: data.id,
                    interactionToken: data.token,
                    guildId: data.guild_id,
                    channelId: data.channel_id,
                    message: description,
                    messageReference: {
                        channel_id: data.channel_id,
                        message_id: data.id,
                        guild_id: data.guild_id
                    },
                });
                break;
            }
            case 'clear': {
                if (!cronJob.clearCronByChannelId(data.channel_id)) {
                    return false;
                } else {
                    restActions.sendMessage({
                        interactionId: data.id,
                        interactionToken: data.token,
                        guildId: data.guild_id,
                        channelId: data.channel_id,
                        message: `Cron successfully cleared`,
                        messageReference: {
                            channel_id: data.channel_id,
                            message_id: data.id,
                            guild_id: data.guild_id
                        },
                    });
                }
                break;
            }
            case 'register': {
                let parameterArr = parameters.split("\" ");
                if (parameterArr.length == 2) {
                    let firstString = parameterArr[0] + "\"";
                    if (firstString[0] === '\"' && firstString[firstString.length - 1] === '\"') {
                        let cron = firstString.substring(1, firstString.length - 1);
                        let message = parameterArr[1];
                        let value = cronJob.registerCron({
                            cron: cron,
                            message: message,
                            guildId: data.guild_id,
                            channelId: data.channel_id
                        });
                        if (value == 'error') {
                            return false;
                        } else {
                            restActions.sendMessage({
                                interactionId: data.id,
                                interactionToken: data.token,
                                guildId: data.guild_id,
                                channelId: data.channel_id,
                                message: `Cron successfully registered`,
                                messageReference: {
                                    channel_id: data.channel_id,
                                    message_id: data.id,
                                    guild_id: data.guild_id
                                },
                            });
                        }
                    } else {
                        return false;
                    }
                }
                else {
                    return false;
                }
                break;
            }
            case 'unregister': {
                if (!isNaN(parameters)) {
                    let value = cronJob.unregisterCron(parameters, data.channel_id);
                    if (value == 'error') {
                        return false;
                    }
                    restActions.sendMessage({
                        interactionId: data.id,
                        interactionToken: data.token,
                        guildId: data.guild_id,
                        channelId: data.channel_id,
                        message: `Cron successfully unregistered`,
                        messageReference: {
                            channel_id: data.channel_id,
                            message_id: data.id,
                            guild_id: data.guild_id
                        },
                    });
                }
                else {
                    return false;
                }
                break;
            }
        }
    }
    return true;
}

exports.end = function() {
    log("Ending cron job");
    cronJob.haltCron();
}