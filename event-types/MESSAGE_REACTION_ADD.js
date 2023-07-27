const tempRepositoryFunc = require('../repository');
const { USAGI_CONSTANTS } = require('../usagi.constants');
const realTimeRepository = tempRepositoryFunc.realTimeRepository;

const { emojiRegex } = require("../utils/common");

exports.process = function(data) {
    let usableData = data.d;
    if (usableData.author?.id == USAGI_CONSTANTS.BOT_DATA.CLIENT_ID) {
        return;
    }
    if (usableData.emoji.id == null) {
        return;
    }

    incrementEmoji(usableData.guild_id, `:${usableData.emoji.name}:${usableData.emoji.id}`);
}

exports.processMessage = function(data) {
    let usableData = data.d;
    if (usableData.author?.id == USAGI_CONSTANTS.BOT_DATA.CLIENT_ID) {
        return;
    }

    let guildId = usableData.guild_id;
    if (usableData.content != null) {
        regRes = [...usableData.content.matchAll(emojiRegex)];
    }

    if (regRes == null || regRes.length == 0) {
        return;
    }

    for (let i = 0; i != regRes.length; i++) {
        let emoji = regRes[i][1];
        incrementEmoji(guildId, emoji);
    }
}

const incrementEmoji = function(guildId, emoji) {
    if (realTimeRepository.emojiUsage[guildId] == null) {
        realTimeRepository.emojiUsage[guildId] = {};
    }
    if (realTimeRepository.emojiUsage[guildId][emoji] == null) {
        realTimeRepository.emojiUsage[guildId][emoji] = 0;
    }
    realTimeRepository.emojiUsage[guildId][emoji]++;
}