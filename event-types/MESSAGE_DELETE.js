const tempRepositoryFunc = require('../repository');
const { timeoutChainer } = require("../utils/timeout-chainer");
const restActions = require('../rest-actions');
const moment = require('moment');
const FormData = require("form-data");
const fileType = require('file-type');

const usagiConstants = require("../usagi.constants").USAGI_CONSTANTS;
var { messageLogs } = require('../message-logs-storage');
const { validMimes, mimeMapping } = require('../utils/common');

exports.process = async function(data) {
    var usableData = data.d;

    let channelId = tempRepositoryFunc.archiveChannel(usableData.guild_id);
    if (channelId == null || usableData.channel_id == channelId) return;

    let messageIndex = messageLogs.findIndex(o => o.id == usableData.id);
    if (messageIndex == -1) return;

    let message = messageLogs[messageIndex];

    let description = '**Deleted message\n\n**' +
                        `Message: ${message.content}\n` +
                        `By: <@${message.author.id}>\n` +
                        `Channel: <#${message.channel_id}>\n`;
    let messageData = null;

    if (message.attachments != null && message.attachments.length > 0) {
        try
        {
            let stopProcessing1 = false;
            let attachmentBuffer = [];
            for (let i = 0; i < message.attachments.length; i++) {
                let attachment = message.attachments[i];
                let buff = await restActions.getImage(attachment.url);
                if (stopProcessing1) return;
                attachmentBuffer.push(buff);
            }

            let startWait = moment();
            let interval = timeoutChainer(async () => {
                if (Object.keys(attachmentBuffer).length != message.attachments.length && moment().diff(startWait) < 120000) {
                    return;
                }
                interval.stop = true;
                try
                {
                    stopProcessing1 = true;
                
                    let counter = 0;
                    messageData = {
                        guildId: usableData.guild_id,
                        channelId: channelId,
                        content: new FormData()
                    }

                    messageData.content.append('payload_json', JSON.stringify({
                        embeds: [{
                            color: usagiConstants.BOT_DATA.EMBED_COLOR_HEX,
                            description: description
                        }]
                    }));

                    let stopProcessing2 = false;
                    let passes = 0;
                    let valid = 0;
                    attachmentBuffer.forEach(async (buffer) => {
                        let o = await fileType.fromBuffer(buffer);
                        if (stopProcessing2) return;
                        if (o && validMimes.indexOf(o.mime) > -1) {
                            messageData.content.append(`${counter}`, buffer, {
                                filename: `${counter}.${mimeMapping[o.mime]}`
                            });
                            counter++;
                            valid++;
                        }
                        passes++;
                    })
                    startWait = moment();
                    interval = timeoutChainer(() => {
                        if (Object.keys(attachmentBuffer).length != passes && moment().diff(startWait) < 60000) {
                            return;
                        }
                        interval.stop = true;
                        stopProcessing2 = true;
                        if (valid == 0) {
                            restActions.sendMessage({
                                guildId: usableData.guild_id,
                                channelId: channelId,
                                embed: {
                                    color: usagiConstants.BOT_DATA.EMBED_COLOR_HEX,
                                    description: description
                                }
                            });
                            return;
                        }
                        restActions.sendMessageComplex(messageData);
                        messageLogs.splice(messageIndex, 1);
                    }, 500)
                } catch {
                    restActions.sendMessage({
                        guildId: usableData.guild_id,
                        channelId: channelId,
                        embed: {
                            color: usagiConstants.BOT_DATA.EMBED_COLOR_HEX,
                            description: description
                        }
                    });
                }
            }, 500);
        } catch {
            restActions.sendMessage({
                guildId: usableData.guild_id,
                channelId: channelId,
                embed: {
                    color: usagiConstants.BOT_DATA.EMBED_COLOR_HEX,
                    description: description
                }
            });
        }
    } else {
        restActions.sendMessage({
            guildId: usableData.guild_id,
            channelId: channelId,
            embed: {
                color: usagiConstants.BOT_DATA.EMBED_COLOR_HEX,
                description: description
            }
        });
    }
}