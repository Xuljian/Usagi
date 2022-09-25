const restAPIUrl = 'https://discord.com/api/v8';

const usagiConstant = require('./usagi.constants').USAGI_CONSTANTS;

const repo = require('./temp-repository');
const realTimeRepository = repo.realTimeRepository;

const https = require('https');
const { timeoutChainer } = require('./utils/timeout-chainer');

const agent = new https.Agent({ keepAlive: true })
const fetch = require('node-fetch').default;

// objects in this queue looks like the object below
//{
//    hostname: 'whatever.com',
//    port: 443,
//    path: '/todos',
//    method: 'GET',
//    callback: function(data)
//}
const queue = [];

// messageObj
//{
//    userId: 'string',
//    embed: { 
//      title: 'string',
//      description: 'string'
//    },
//    message: 'string'
//}
exports.sendDMById = function (messageObj) {
    var options = {
        url: restAPIUrl + '/users/@me/channels',
        method: 'post',
        body: JSON.stringify({
            recipient_id: messageObj.userId
        }),
        callback: function (data) {
            let subOptions = {
                url: restAPIUrl + `/channels/${data.id}/messages`,
                method: 'post',
                body: JSON.stringify({
                    content: messageObj.message,
                    tts: false,
                    embed: messageObj.embed
                })
            }
            queue.push(subOptions);
        }
    }
    queue.push(options);
}

// messageObj
//{
//    guildId: 'string'
//    channelId: 'string'
//    embed: { 
//      title: 'string',
//      description: 'string'
//    },
//    message: 'string'
//}
exports.sendMessage = function (messageObj) {
    if (messageObj.channelId == null) {
        console.log('channel id required');
        return;
    }
    let subOptions = {
        url: restAPIUrl + `/channels/${messageObj.channelId}/messages`,
        method: 'post',
        guildId: messageObj.guildId,
        body: JSON.stringify({
            content: messageObj.message,
            message_reference: messageObj.messageReference,
            tts: false,
            embed: messageObj.embed
        })
    }
    queue.push(subOptions);
}

exports.refreshGuildDetails = function (guildId, callback) {
    let subOptions = {
        url: restAPIUrl + `/guilds/${guildId}`,
        guildId: guildId,
        method: 'get',
        callback: callback
    }
    queue.push(subOptions);
}

//{
//    guildId: 'string'
//    channelId: 'string',
//    messageId: 'string',
//    emoji: 'string'
//}
exports.reactToMessage = function (options) {
    let subOptions = {
        url: restAPIUrl + `/channels/${options.channelId}/messages/${options.messageId}/reactions/${options.emoji}/@me`,
        method: 'put',
        guildId: options.guildId,
        ignoreResult: true
    }
    queue.push(subOptions);
}

exports.refreshGuildMembers = function (guildId, callback) {
    let subOptions = {
        url: restAPIUrl + `/guilds/${guildId}/members?limit=1000`,
        method: 'get',
        guildId: guildId,
        callback: callback,
        callbackParams: guildId
    }
    queue.push(subOptions);
}

exports.deleteMessage = function(channelId, messageId) {
    let subOptions = {
        guildId: guildId,
        url: restAPIUrl + `/channels/${channelId}/messages/${messageId}`,
        method: 'delete',
        ignoreResult: true
    }
    queue.push(subOptions);
}

exports.registerEmoji = function(options) {
    let subOptions = {
        url: restAPIUrl + `/guilds/${options.guildId}/emojis`,
        guildId: options.guildId,
        method: 'post',
        callback: (data, options) => {
            delete options.image;
            options.callback(data, options)
        },
        callbackParams: options,
        body: JSON.stringify({
            name: options.name,
            image: options.image
        })
    }
    queue.push(subOptions);
}

exports.deleteEmoji = function(guildId, emojiId, callback) {
    let subOptions = {
        url: restAPIUrl + `/guilds/${guildId}/emojis/${emojiId}`,
        method: 'delete',
        guildId: guildId,
        callback: callback,
        isComplex: true,
        body: {
            getHeaders: () => {
                return {'content-type': ''}
            }
        },
        callbackParams: {emojiId: emojiId, guildId: guildId}
    }
    queue.push(subOptions);
}

exports.refreshGuildChannels = function (guildId, callback) {
    let subOptions = {
        url: restAPIUrl + `/guilds/${guildId}/channels`,
        method: 'get',
        callback: callback,
        callbackParams: guildId
    }
    queue.push(subOptions);
}

exports.sendMessageComplex = function (messageObj) {
    if (messageObj.channelId == null) {
        console.log('channel id required');
        return;
    }

    let subOptions = {
        guildId: messageObj.guildId,
        url: restAPIUrl + `/channels/${messageObj.channelId}/messages`,
        method: 'post',
        body: messageObj.content,
        isComplex: true
    }
    queue.push(subOptions);
}

//{
//    guildId: 'string',
//    userId: 'string',
//    executorId: 'string'
//    channelId: 'string'
//    failedMessage: 'string'
//    successMessage: 'string'
//}
exports.kickUser = function (obj) {
    if (repo.userAllowKick(obj.guildId, obj.executorId)) {
        let subOptions = {
            guildId: obj.guildId,
            url: restAPIUrl + `/guilds/${obj.guildId}/members/${obj.userId}`,
            method: 'delete',
            ignoreResult: true,
            callback: () => {
                let subSubOptions = {
                    url: restAPIUrl + `/channels/${obj.channelId}/messages`,
                    method: 'post',
                    body: JSON.stringify({
                        content: obj.successMessage,
                        tts: false
                    })
                }
                queue.push(subSubOptions);
            }
        }
        queue.push(subOptions);
    } else {
        let subOptions = {
            url: restAPIUrl + `/channels/${obj.channelId}/messages`,
            method: 'post',
            body: JSON.stringify({
                content: obj.failedMessage,
                tts: false
            })
        }
        queue.push(subOptions);
    }
}

var findUserId = function (username) {
    let users = realTimeRepository.users;
    let bots = realTimeRepository.bots;
    let found = null;
    for (var key in users) {
        if (found == null && Object.prototype.hasOwnProperty.call(users, key) && users[key] != null && users[key].username.toLowerCase() === username.toLowerCase()) {
            found = key;
        }
    }
    if (found == null) {
        for (var key in bots) {
            if (found == null && Object.prototype.hasOwnProperty.call(bots, key) && bots[key] != null && bots[key].username.toLowerCase() === username.toLowerCase()) {
                found = key;
            }
        }
    }
    if (found == null) {
        console.log('user not found')
    }
    return found;
}

exports.getImage = async function(url) {
    let res = await fetch(url);
    let buffer = await res.arrayBuffer();
    return arrayBufferToBuffer(buffer);
}

let bufferToArrayBuffer = function (buf) {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}

let arrayBufferToBuffer = function (ab) {
    const buf = Buffer.alloc(ab.byteLength);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        buf[i] = view[i];
    }
    return buf;
}

var executeRequest = async function () {
    timeoutChainer(async () => {
        if (realTimeRepository.hasInit) {
            let options = queue.shift();

            if (options != null && (realTimeRepository.guildIgnore || []).indexOf(options.guildId) == -1) {
                let headers = {
                        'Authorization': `Bot ${usagiConstant.BOT_DATA.BOT_TOKEN}`,
                        'Accept': '*/*',
                        'User-Agent': 'DiscordBot (UsagiBot.com, 0.0.1)',
                        'content-type': 'application/json'
                    };
                if (options.isComplex != null && options.isComplex) {
                    headers = Object.assign(headers, options.body.getHeaders())
                }

                let o = await fetch(options.url, {
                    method: options.method,
                    headers: headers,
                    body: options.body,
                    agent: agent
                });
                try {
                    if (o.ok) {
                        if (options.ignoreResult == null || !options.ignoreResult) {
                            try {
                                let i = await o.json();
                                if (options.callback != null) {
                                    try {
                                        options.callback(i, options.callbackParams);
                                    } catch (e) {
                                        console.log(e);
                                    }
                                }
                            } catch (i) {
                                console.log('thrown from json function 2', i);
                                if (options.callback != null) {
                                    try {
                                        options.callback(null, options.callbackParams);
                                    } catch (e) {
                                        console.log(e);
                                    }
                                }
                            }
                        } else {
                            if (options.callback != null && typeof options.callback === 'function') {
                                options.callback(options.callbackParams);
                            }
                        }
                    } else {
                        try {
                            let i = await o.json();
                            console.log(`server returned ${o.statusText} with message\n`, i);
                        } catch (i) {
                            console.log('thrown from json function 2', i);
                        }
                    }
                } catch (e) {
                    console.log("Oh no", e);
                }
            }
        }
    }, 500);
}

executeRequest();