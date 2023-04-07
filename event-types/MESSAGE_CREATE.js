const restActions = require('../rest-actions');
const tempRepositoryFunc = require('../repository');
var { uiMessageLogs, messageLogs } = require('../message-logs-storage');

const usagiConstants = require("../usagi.constants").USAGI_CONSTANTS;
const realTimeRepository = tempRepositoryFunc.realTimeRepository;

const { checkUILoggingIgnore, pickOne } = require('../utils/common');
const { USAGI_COMMANDS } = require('../commands');
const { validMimes } = require('../utils/common');
const fileType = require('file-type');

const getTag = require('../utils/common').getTag;

const prefix = usagiConstants.BOT_DATA.COMMAND_PREFIX;

const INVALID_MESSAGES = [
    'I do not know what you want :(',
    'Wrong commands maybe?',
    '*Rabbit noises*',
    '*Angry rabbit noises*'
];

exports.process = async function(data) {
    let usableData = data.d;
                
    if (usableData.interaction != null) {
        // nothing to log for interaction
        return;
    }

    if (usableData.guild_id == null) {
        if (!checkUILoggingIgnore(usableData.channel_id)) {
            await logMessage(usableData, true, usableData.author?.id === usagiConstants.BOT_DATA.CLIENT_ID);
        }
    } else {
        if (!checkUILoggingIgnore(usableData.channel_id) &&
            (!realTimeRepository.archiveChannel[usableData.guild_id] || realTimeRepository.archiveChannel[usableData.guild_id].indexOf(usableData.channel_id) < 0)) {
            await logMessage(usableData, false, usableData.author?.id === usagiConstants.BOT_DATA.CLIENT_ID);
        }
        if (usableData.guild_id != null) {
            if (usableData.author?.id === usagiConstants.BOT_DATA.CLIENT_ID) {
                return;
            }

            let hasCommand = await matchCommand(usableData);
            if (!hasCommand)
                cleanupAndStoreToCache(usableData);
        }
    }
}

let logMessage = async function (usableData, isTargetted, isMe) {
    let data = {
        message: usableData.content,
        isTargetted: isTargetted,
        isMe: isMe
    };
    if (usableData.id != null) {
        data.messageId = usableData.id;
    }
    if (usableData.author?.username != null) {
        data.username = usableData.author.username;
    }
    if (usableData.author?.id != null) {
        data.userId = usableData.author.id;
    }
    if (usableData.member?.nick != null) {
        data.userNick = usableData.member?.nick;
    }
    if (usableData.guild_id != null) {
        data.guildId = usableData.guild_id;
        data.guildName = tempRepositoryFunc.getGuildName(usableData.guild_id) || 'Can\' find guild name';
    }
    if (usableData.channel_id != null) {
        data.channelId = usableData.channel_id;
        data.channelName = realTimeRepository.channels[usableData.channel_id]?.name || 'Can\' find channel name';
    }

    if (usableData.attachments != null && usableData.attachments.length > 0) {
        let buffer = await restActions.getImage(usableData.attachments[0].url);
        
        let o = await fileType.fromBuffer(buffer);
        
        if (o != null && validMimes.indexOf(o.mime) > -1) {
            let base64image = buffer.toString('base64');
            data.imageUri = `data:${o.mime};base64,${base64image}`;
            uiMessageLogs.push(data);
        }
    } else {
        uiMessageLogs.push(data);
    }
}

let matchCommand = async function (data) {
    let content = data.content;
    let regexCommand = new RegExp(`^${prefix}.*`, 'gm');
    let result = regexCommand.exec(content);
    if (result) {
        let nonGlobalRegexCommand = new RegExp(`^${prefix}`);
        content = content.replace(nonGlobalRegexCommand, '');
        let splitCommand = content.split(' ');
        let command = splitCommand.shift();
        let args = splitCommand.join(' ');

        if (USAGI_COMMANDS[command.toLowerCase()] == null) {
            USAGI_COMMANDS['help'].process(data);
            return false;
        } else {
            let res = await USAGI_COMMANDS[command.toLowerCase()].process(data, args);
            if (res == false) {
                invalidCommands(data);
            }
            return true;
        }
    }
    return false;
}

let cleanupAndStoreToCache = function(usableData) {
    if (usableData.author?.bot == true) return;
    let localJSON = JSON.parse(JSON.stringify(usableData));
    delete localJSON['timestamp'];
    delete localJSON['referenced_message'];
    delete localJSON['pinned'];
    delete localJSON['nonce'];
    delete localJSON['mentions'];
    delete localJSON['mention_roles'];
    delete localJSON['mention_everyone'];
    delete localJSON['flag'];
    delete localJSON['embeds'];
    delete localJSON['components'];
    messageLogs.push(localJSON);
    if (messageLogs.length > 100000) {
        messageLogs.shift();
    }
}

var invalidCommands = function (data) {
    restActions.sendMessage({
        interactionId: data.id,
        interactionToken: data.token,
        guildId: data.guild_id,
        channelId: data.channel_id,
        message: `${getTag(data.author?.id)} ${pickOne(INVALID_MESSAGES)}`.trim()
    });
}