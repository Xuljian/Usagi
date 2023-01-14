const restActions = require('../rest-actions');
const usagiConstants = require("../usagi.constants").USAGI_CONSTANTS;
const tempRepositoryFunc = require('../temp-repository');

const prefix = usagiConstants.BOT_DATA.COMMAND_PREFIX;
const realTimeRepository = tempRepositoryFunc.realTimeRepository;

const { validMimes, mimeMapping } = require('../utils/common');
const getTag = require('../utils/common').getTag;
const fileType = require('file-type');

exports.process = async function(data, args) {
    if (validEmojiChannel(data.channel_id)) {
        await mainProcess(data, args)
    }
}

let mainProcess = async function(data, args) {
    let splitArgs = args.split(' ');
    let firstArg = splitArgs[0];
    let emojiName = '';

    if (firstArg == null || firstArg === '' || firstArg === '?') {
        let description = '**Using Emoji\n\n**' +
                            `\`\`\`${prefix}emoji <emojiname>\n` +
                            `${prefix}emoji delete <emoji>\`\`\`\n` +
                            'This command is to add and delete emoji!\n' +
                            'There are only 2 ways to use this command.\n' +
                            '\`\`\`First is:\n' +
                            `${prefix}emoji <emojiname>, this command is for adding emoji, the <emojiname> is for you to name the emoji that you want to add and most importantly make sure you upload the emoji image too when using this comamnd\n` +
                            'Second is:\n' +
                            `${prefix}emoji delete <emoji>, this command is to delete the emoji, <emoji> is just the emoji you want to delete. If you do not have nitro and you need to delete the emoji, you have to get the id of the emoji and type ::id of the emoji in place of <emoji> to delete it\n\`\`\``
        restActions.sendMessage({
            guildId: data.guild_id,
            channelId: data.channel_id,
            embed: {
                color: usagiConstants.BOT_DATA.EMBED_COLOR_HEX,
                description: description
            }
        });
        return true;
    }

    if (firstArg == 'delete') {
        let splitSecondArg = splitArgs[1].split(':');
        if (splitSecondArg.length != 3) {
            return false;
        }
        let valueToKill = 0;
        if (splitSecondArg[2].indexOf('>') > -1) {
            valueToKill = 1;
        }
        let emojiId = splitSecondArg[2].substring(0, splitSecondArg[2].length - valueToKill);
        if(!isNaN(parseInt(emojiId))) {
            restActions.deleteEmoji(data.guild_id, emojiId, (response, callbackParams) => {
                if (callbackParams.emojiId == emojiId && callbackParams.guildId == data.guild_id) {
                    restActions.sendMessage({
                        guildId: data.guild_id,
                        channelId: data.channel_id,
                        message: `Emoji deleted`
                    })
                }
            });
        }
        return true;
    }

    emojiName = firstArg;

    let imageData = data.attachments[0];
    
    let buffer = await restActions.getImage(imageData.url);
    
    if (Buffer.byteLength(buffer) > usagiConstants.MAX_IMAGE_UPLOAD_SIZE) {
        imageTooHuge(data);
    }
    await mainEmojiProcessor(data, buffer, emojiName);
}

let mainEmojiProcessor = async function(data, buffer, emojiName) {
    let o = await fileType.fromBuffer(buffer);
    
    if (validMimes.indexOf(o.mime) > -1) {
        let base64image = buffer.toString('base64');
        restActions.registerEmoji({
            name: emojiName.split('"').join('').split(':').join(''),
            image: `data:${o.mime};base64,${base64image}`,
            channelId: data.channel_id,
            guildId: data.guild_id,
            messageId: data.id,
            callback: (data, options) => {
                let emojiStringPrefix = ':';
                if (mimeMapping[o.mime] == 'gif') {
                    emojiStringPrefix = 'a:';
                }
                if (data.id != null) {
                    restActions.sendMessage({
                        guildId: data.guild_id,
                        channelId: options.channelId,
                        message: `Emoji added <${emojiStringPrefix}${data.name}:${data.id}>`
                    })
                }
            }
        })
    }
}

let validEmojiChannel = function(channelId) {
    return realTimeRepository.emojiChannel.indexOf(channelId) > -1;
}

let imageTooHuge = function (data) {
    restActions.sendMessage({
        interactionId: data.id,
        interactionToken: data.token,
        guildId: data.guild_id,
        channelId: data.channel_id,
        message: `${getTag(data.author?.id)} The file you uploaded is too huge in terms of size. A max of 256kb is allowed.`.trim()
    });
}