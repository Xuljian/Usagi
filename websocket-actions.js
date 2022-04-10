const FormData = require("form-data");
const { USAGI_CONSTANT } = require("./usagi.constants");

const pso2Modules = require('./pso2-modules');
const cronJob = require('./cron-job');

const messageLog = [];

var mainProcess = function () {

    const zlib = require("zlib");

    const WebSocket = require('ws')

    const cdnUrl = 'https://cdn.discordapp.com/';
    const happyGifPath = 'C:\\Data\\UsagiBotDump\\happy.gif';

    const usagiConstants = require('./usagi.constants').USAGI_CONSTANT;

    const realTimeRepository = require('./temp-repository').realTimeRepository;
    const tempRepositoryFunc = require('./temp-repository');

    const restActions = require('./rest-actions');
    const fileType = require('file-type');

    const maxImageSize = 262144;

    const fs = require('fs');

    const prefix = '#!';

    var validMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ]

    var triedResuming = false;

    var mimeMapping = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp'
    }

    var messages = [
        'I do not know what you want :(',
        'Wrong commands maybe?',
        '*Rabbit noises*',
        '*Angry rabbit noises*'
    ];

    const USAGI_COMMANDS = {
        random: (data, args) => {
            processRandom(data, args);
        },
        math: (data, args) => {
            processMath(data, args);
        },
        pso2search: (data, args) => {
            processPSO2Search(data, args);
        },
        pso2file: (data, args) => {
            processPSO2Search(data, args, true);
        },
        cron: (data, args) => {
            processCron(data, args);
        },
        emoji: (data, args) => {
            if (validEmojiChannel(data.channel_id)) {
                processEmoji(data, args)
            }
        }
    }

    var stringMappedEmoji = {
        match: function (string) {
            let emojis = [];
            for (var key in this) {
                if (Object.prototype.hasOwnProperty.call(this, key) && key !== 'match') {
                    let emoji = this[key];
                    if (emoji != null) {
                        let regexString = `(?:\\s|^)${key}` + (emoji.typeStrong == null || !emoji.typeStrong ? '' : '(?:\\s|$)');
                        let regex = new RegExp(regexString, "g");
                        let result = regex.exec(string);
                        if (result != null) {
                            emojis.push({
                                emoji: emoji.emoji,
                                index: result.index,
                                message: emoji.message
                            });
                        }
                    }
                }
            }
            return emojis;
        }
    }

    var heartbeat = {
        op: 1,
        d: null
    }

    var activities = 
        [{
            name: 'Gift Game',
            type: 5,
            created_at: new Date().getTime()
        },
        {
            name: 'with Leticia and Pest',
            type: 0,
            created_at: new Date().getTime()
        },
        {
            name: 'Black † White',
            type: 2,
            created_at: new Date().getTime()
        }]

    let getActivity = function() {
        let randomValue = Math.floor(Math.random() *  3);
        return activities[randomValue];
    }

    var resume = {
        op: 6,
        d: {
            token: usagiConstants.BOT_DATA.BOT_TOKEN,
            session_id: null,
            seq: null
        }
    }

    var identify = {
        op: 2,
        d: {
            token: usagiConstants.BOT_DATA.BOT_TOKEN,
            presence: {
                since: null,
                activities: [
                    getActivity()
                ],
                status: 'online',
                afk: false
            },
            properties: {
                $os: 'windows',
                $browser: 'UsagiBot',
                $device: 'UsagiBot'
            },
            intents: usagiConstants.allIntents()
        }
    }

    var sequenceNumber = null;

    var zlibSuffix = [0x00, 0x00, 0xff, 0xff];

    var discordGatewayVersionNumber = 8;
    var encoding = 'json';

    var socket = new WebSocket(`wss://gateway.discord.gg/?v=${discordGatewayVersionNumber}&encoding=${encoding}`);

    socket.sendCustom = function (data, callback) {
        callback = callback || ((err) => { });
        this.send(JSON.stringify(data), callback);
    }

    socket.onopen = function (e) {
        console.log('CONNECTED!');
    };

    socket.onmessage = function (msg) {
        if (msg.data != null) {
            let data = JSON.parse(msg.data);
            matchOpCode(data);
        }
        //decompressMessaege(msg, processMessage);
    };

    socket.onclose = function (event) {
        if (socket.readyState === WebSocket.CLOSED) {
            console.log('socket has closed, restarting');
            mainProcess();
        }
    };

    socket.onerror = function (error) {
        console.log('onerror ' + socket.readyState);
        //if (socket.readyState === WebSocket.CLOSED) {
        //    mainProcess();
        //}
    };

    var fireResume = function() {
        resume.d.session_id = realTimeRepository.resumeData.sessionId;
        resume.d.seq = realTimeRepository.resumeData.sequenceId;
        socket.sendCustom(resume);
    }

    var fireIdentify = function () {
        console.log('Fire identify D:');
        socket.sendCustom(identify);
    }

    var matchOpCode = function (data) {
        switch (data.op) {
            case 10: {
                registerHeartbeat(data.d['heartbeat_interval']);
                registerSequenceNumber(data);
                if (realTimeRepository.resumeData.sessionId != null) {
                    triedResuming = true;
                    console.log('Resuming.....');
                    fireResume();
                } else {
                    fireIdentify();
                }
                break;
            }
            case 0: {
                registerSequenceNumber(data);
                registerSessionId(data);
                matchType(data);
                //console.log('0', data);
                break;
            }
            case 11: {
                break;
            }
            case 7: {
                console.log('Resumed!')
                break;
            }
            case 9: {
                console.log('op code 9');
                if (triedResuming) {
                    triedResuming = false;
                    setTimeout(() => {
                        fireIdentify();
                    }, 5000);
                    break;
                }
                console.log('op code 9', data);
                break;
            }
            default: {
                console.log(data.op, data);
                registerSequenceNumber(data);
                break;
            }
        }
    }

    var registerSessionId = function(data) {
        if (data.d != null && data.d.session_id != null) {
            realTimeRepository.resumeData.sessionId = data.d.session_id;
        }
    }

    var matchType = function (data) {
        switch (data.t) {
            case 'READY': {
                var usableData = data.d;
                if (usableData.guilds.length > 0) {
                    usableData.guilds.forEach((o) => {
                        if (realTimeRepository.guilds[o.id] != null) {
                            delete realTimeRepository.guilds[o.id];
                        }
                    });
                }
                realTimeRepository.hasInit = true;
                break;
            }
            case 'RESUMED': {
                realTimeRepository.hasInit = true;
                break;
            }
            case 'GUILD_CREATE': {
                var usableData = data.d;
                if (realTimeRepository.guilds[usableData.id] == null) {
                    realTimeRepository.guilds[usableData.id] = usableData;
                }
                break;
            }
            case 'MESSAGE_CREATE': {
                let usableData = data.d;

                reactToMessage(usableData);
                logImage(usableData);

                if (usableData.guild_id == null) {
                    if (!checkIgnore(usableData.channel_id)) {
                        logMessage(usableData, true, usableData.author?.id === usagiConstants.BOT_DATA.CLIENT_ID);
                    }
                } else {
                    if (!checkIgnore(usableData.channel_id)) {
                        logMessage(usableData, false, usableData.author?.id === usagiConstants.BOT_DATA.CLIENT_ID);
                    }
                    if (usableData.guild_id != null) {
                        if (usableData.author?.id === usagiConstants.BOT_DATA.CLIENT_ID) {
                            return;
                        }
                        botCounter(usableData);
                        matchCommand(usableData);
                    }
                }
                break;
            }
            default: {
                //console.log(data)
                break;
            }
        }
    }

    var botCounter = function(data) {
        let textRegex = /\*\*Xuljian\*\* and \*\*.*\*\* are now \"friends\"\!/;
        if (data.channel_id != null) {
            let messageData = {
                channelId: data.channel_id
            }
            let message = data.content;
            let execData = textRegex.exec(message);
            if (execData != null && data.author?.id !== usagiConstants.BOT_DATA.CLIENT_ID) {
                fs.readFile(happyGifPath, (err, buffer) => {
                    if (err) {
                        console.log('OH NO!!!');
                        return;
                    }
                    fileType.fromBuffer(buffer).then((o) => {
                        if (validMimes.indexOf(o.mime) > -1) {
                            let content = new FormData();
                            messageData.content = content;
                            content.append('payload_json', JSON.stringify({
                                content: 'Yay!!!'
                            }));
                            content.append('happy', buffer, {
                                filename: `happy.${mimeMapping[o.mime]}`
                            });
                            restActions.sendMessageComplex(messageData);
                        }
                    })
                })
            }
        }
    }

    var checkIgnore = function (id) {
        let result = false;
        realTimeRepository.channelIgnore.forEach(o => {
            if (!result && o == id) {
                result = true;
            }
        })
        return result;
    }

    var reactToMessage = function (usableData) {
        if (usableData.channel_id != null) {
            let message = usableData.content;
            let emojis = stringMappedEmoji.match(message);
            if (emojis != null && emojis.length > 0) {
                emojis.sort((a, b) => {
                    return a.index - b.index;
                }).forEach(o => {
                    restActions.reactToMessage({
                        channelId: usableData.channel_id,
                        messageId: usableData.id,
                        emoji: o.emoji
                    })
                    if (o.message != null) {
                        restActions.sendMessage({
                            channelId: usableData.channel_id,
                            message: o.message
                        })
                    }
                })
            }
        }
    }

    var logImage = function(usableData) {
        if (!tempRepositoryFunc.hasListenerForArchive(usableData.guild_id, usableData.channel_id)) return;

        let channelId = tempRepositoryFunc.archiveChannel(usableData.guild_id);
        if (channelId == null) return;
        
        if (usableData.author?.bot == true) return;

        if (usableData.attachments != null && usableData.attachments.length > 0) {
            usableData.attachments.forEach(attachment => {
                let messageData = {
                    channelId: channelId
                }
                restActions.getImage(attachment.url, (buffer) => {
                    fileType.fromBuffer(buffer).then((o) => {
                        if (validMimes.indexOf(o.mime) > -1) {
                            if (usableData.author?.id != null && usableData.author?.avatar != null) {
                                let url = `${cdnUrl}avatars/${usableData.author.id}/${usableData.author.avatar}`;
                                restActions.getImage(url, (subBuffer) => {
                                    fileType.fromBuffer(subBuffer).then((i) => {
                                        if (validMimes.indexOf(i.mime) > -1) {
                                            let content = new FormData();
                                            messageData.content = content;
                                            content.append('payload_json', JSON.stringify({
                                                embed: {
                                                    color: 16731558,
                                                    image: {
                                                        url: `attachment://upload.${mimeMapping[o.mime]}`
                                                    },
                                                    footer: {
                                                        text: `by ${usableData.author.nick != null ? usableData.author.nick : usableData.author.username}${realTimeRepository.channels[usableData.channel_id] == null ? '' : ' from ' + realTimeRepository.channels[usableData.channel_id].name}`,
                                                        icon_url: `attachment://profile.${mimeMapping[i.mime]}`
                                                    }
                                                }
                                            }));
                                            content.append('upload', buffer, {
                                                filename: `upload.${mimeMapping[o.mime]}`
                                            });
                                            content.append('profile', subBuffer, {
                                                filename: `profile.${mimeMapping[i.mime]}`
                                            });
                                            restActions.sendMessageComplex(messageData);
                                        }
                                    })
                                })
                            } else {
                                let content = new FormData();
                                messageData.content = content;
                                content.append('payload_json', JSON.stringify({
                                    embed: {
                                        color: 16731558,
                                        image: {
                                            url: `attachment://upload.${mimeMapping[o.mime]}`
                                        },
                                        footer: {
                                            text: `by ${usableData.author.nick != null ? usableData.author.nick : usableData.author.username}${realTimeRepository.channels[usableData.channel_id] == null ? '' : ' from ' + realTimeRepository.channels[usableData.channel_id].name}`,
                                        }
                                    }
                                }));
                                content.append('upload', buffer, {
                                    filename: `upload.${mimeMapping[o.mime]}`
                                });
                                restActions.sendMessageComplex(messageData);
                            }
                        }
                    })
                })
            })
        }
    }

    var logMessage = function (usableData, isTargetted, isMe) {
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
            restActions.getImage(usableData.attachments[0].url, (buffer) => {
                fileType.fromBuffer(buffer).then((o) => {
                    if (o != null && validMimes.indexOf(o.mime) > -1) {
                        let base64image = buffer.toString('base64');
                        data.imageUri = `data:${o.mime};base64,${base64image}`;
                        messageLog.push(data);
                    }
                })
            })
        } else {
            messageLog.push(data);
        }
    }

    var matchCommand = function (data) {
        let content = data.content;
        let regexCommand = new RegExp(`^${prefix}*`, 'gm');
        let result = regexCommand.exec(content);
        if (result) {
            let nonGlobalRegexCommand = new RegExp(`^${prefix}*`);
            content = content.replace(nonGlobalRegexCommand, '');
            let splitCommand = content.split(' ');
            let command = splitCommand.shift();
            let args = splitCommand.join(' ');

            if (USAGI_COMMANDS[command.toLowerCase()] == null) {
                help(data);
            } else {
                USAGI_COMMANDS[command.toLowerCase()](data, args);
            }
        }
    }

    var help = function(data) {
        let description = '**Usagi bot commands\n\n**' +
                            'List of available commands!\n' +
                            '\`\`\`' + Object.keys(USAGI_COMMANDS).join('\n') +
                            '\`\`\`\n' +
                            'All of them have a help page which can be brought up with just the command with no options.\n' +
                            'Example:\n' +
                            `\`\`\`${prefix}math\n\`\`\``
        restActions.sendMessage({
            channelId: data.channel_id,
            embed: {
                color: 16731558,
                description: description
            }
        });
        return;
    }

    var validEmojiChannel = function(channelId) {
        return realTimeRepository.emojiChannel.indexOf(channelId) > -1;
    }

    var processCron = function(data, args) {
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
                channelId: data.channel_id,
                embed: {
                    color: 16731558,
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
                    if (data.author?.id !== USAGI_CONSTANT.BOT_DATA.OWNER_ID) {
                        restActions.sendMessage({
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
                        invalidCommands(data);
                    } else {
                        restActions.sendMessage({
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
                                invalidCommands(data);
                            } else {
                                restActions.sendMessage({
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
                            invalidCommands(data);
                        }
                    }
                    else {
                        invalidCommands(data);
                    }
                    break;
                }
                case 'unregister': {
                    if (!isNaN(parameters)) {
                        let value = cronJob.unregisterCron(parameters, data.channel_id);
                        if (value == 'error') {
                            invalidCommands(data);
                            return;
                        }
                        restActions.sendMessage({
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
                        invalidCommands(data);
                    }
                    break;
                }
            }
        }
    }

    var processMath = function(data, args) {
        if (args == null || args === '' || args === '?') {
            let description = '**Using Math\n\n**' +
                              `\`\`${prefix}math <expression>\`\`\n\n` +
                              'This command is to do....well math!\n' +
                              '<expression> is be the math you want to do.' +
                              '\`\`\`+ for addition\n' +
                              '- for subtraction\n' +
                              '* for multiplication\n' +
                              '** for exponential\n' + 
                              '/ for division\n' +
                              'in for searching existence of a string\`\`\`\n' +
                              'Example.\n' + 
                              `\`\`\`${prefix}math 1+1\n` +
                              `${prefix}math 1+1+2+3/3*4**6 (got no idea the answer why don't you try out? Expression as complex as this works too)\n` +
                              `${prefix}math "hello" in "hello world" (this will search hello in hello world and will highlight the left hand side word in the right hand side word)\`\`\``
            restActions.sendMessage({
                channelId: data.channel_id,
                embed: {
                    color: 16731558,
                    description: description
                }
            });
            return;
        }
        try {
            let result = scopeEval(args);
            if (result == null || result.result == null ||
                (!result.isIn && isNaN(result.result))) {
                invalidCommands(data);
                return;
            }
            if (result.isIn) {
                restActions.sendMessage({
                    channelId: data.channel_id,
                    message: `${result.result}`,
                    messageReference: {
                        channel_id: data.channel_id,
                        message_id: data.id,
                        guild_id: data.guild_id
                    },
                });
                return;
            }
            restActions.sendMessage({
                channelId: data.channel_id,
                message: `<@!${data.author?.id}> value is ${result.result}`
            });
        } catch (e) {
            console.log(e);
            invalidCommands(data);
            return;
        }
    }

    var processRandom = function(args, data) {
        let splitArgs = args.split(' ');

        if (splitArgs[0] === '?') {
            restActions.sendMessage({
                channelId: data.channel_id,
                message: `<@!${data.author?.id}> The command is "${prefix}random <min> <max>" where min and max are inclusive. It will not work if both are not given`
            });
        } else if (/\d+/.exec(splitArgs[0]) != null && /\d+/.exec(splitArgs[1]) != null) {
            let low = parseInt(splitArgs[0]);
            let high = parseInt(splitArgs[1]);
            let randomValue = Math.floor(Math.random() * (high - low + 1) + low);

            restActions.sendMessage({
                channelId: data.channel_id,
                message: `<@!${data.author?.id}> you rolled ${randomValue}`
            });
        } else {
            invalidCommands(data);
        }
    }

    var scopeEval = function (evalString) {
        let cleanScope = {};
        return function () {
            'use strict'
            if (checkIn(evalString)) {
                let res = processIn(evalString);
                if (res != null) {
                    return {
                        result: res,
                        isIn: true
                    };
                }
            }
            evalString = evalString.split('[').join('(');
            evalString = evalString.split(']').join(')');
            evalString = evalString.split('{').join('(');
            evalString = evalString.split('}').join(')');
            evalString = evalString.split(' ').join('');
            evalString = evalString.split('\\').join('');
            let mathRegex = /^[+\-/*\.\d\(\)]+$/;

            if (mathRegex.exec(evalString) == null) {
                throw 'Invalid math operations';
            }
            return {
                result: eval(evalString),
                isIn: false
            };
        }.bind(cleanScope)();
    }

    var checkIn = function(string) {
        string = (string || '').trim();
        if (string.indexOf('in') > -1) {
            return true;
        }
        return false;
    }

    var processIn = function(string) {
        string = (string || '').trim();
        string = string.split('*').join('');
        let splitted = string.split('in');
        if (splitted.length >= 2) {
            let firstString = splitted.shift().trim();
            let secondString = splitted.join('in').trim();
            if (firstString[0] === '\"' && firstString[firstString.length - 1] === '\"' && secondString[0] === '\"' && secondString[secondString.length - 1] === '\"') {
                let newFirst = JSON.stringify(firstString.substring(1, firstString.length - 1));
                let regexString = JSON.stringify(newFirst.substring(1, newFirst.length - 1));
                let newSecond = JSON.stringify(secondString.substring(1, secondString.length - 1));
                let regex = new RegExp(`(${regexString.substring(1, regexString.length - 1)})`, 'g');
                let result = newSecond.replace(regex, '**$1**');
                result = eval(result.replace(/\*\*\*\*/g, ''));
                if (result.indexOf('*') > -1) {
                    return result;
                }
                return "No matching strings found :(";
            }
        }
        return null;
    }

    var invalidCommands = function (data) {
        let low = 0;
        let high = messages.length - 1;
        let randomValue = Math.floor(Math.random() * (high - low + 1) + low);

        restActions.sendMessage({
            channelId: data.channel_id,
            message: `<@!${data.author?.id}> ${messages[randomValue]}`
        });
    }

    var imageTooHuge = function (data) {
        restActions.sendMessage({
            channelId: data.channel_id,
            message: `<@!${data.author?.id}> the file you uploaded is too huge in terms of size. A max of 256kb is allowed.`
        });
    }

    var registerSequenceNumber = function (data) {
        if (data.s != null && data.s > sequenceNumber) {
            sequenceNumber = data.s;
        }
        heartbeat.d = sequenceNumber;
        realTimeRepository.resumeData.sequenceId = heartbeat.d;
    }

    var registerHeartbeat = function (interval) {
        setTimeout(function () {
            socket.sendCustom(heartbeat);
            registerHeartbeat(interval);
        }, interval);
    }

    var decompressMessaege = function (potentiallyCompressedMessage, callback) {
        var message = potentiallyCompressedMessage;

        if (message.length < 4 || !testForZlib(message)) {
            return message;
        }

        zlib.inflate(buffer, (err, buffer) => {
            callback(buffer);
        });
    }

    var testForZlib = function (message) {
        let match = 0;
        for (var x = 1; x != 5; x++) {
            if (message[message.length - x] == zlibSuffix[zlibSuffix.length - x]) {
                match++;
            }
        }
        return match == 4;
    }

    var processMessage = function (msg) {
        console.log(msg);
    }

    //#region websocket complex processes
    var processPSO2Search = function(data, args, exact) {
        if (!pso2Modules.pso2ModulesReady) {
            restActions.sendMessage({
                channelId: data.channel_id,
                message: `<@!${data.author?.id}> this function is not ready yet`
            });
            return;
        }

        if (args == null || args === '' || args === '?') {
            let description = getDescription(exact);
            restActions.sendMessage({
                channelId: data.channel_id,
                embed: {
                    color: 16731558,
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
                        channelId: data.channel_id,
                        messageReference: {
                            channel_id: data.channel_id,
                            message_id: data.id,
                            guild_id: data.guild_id
                        },
                        message: `<@!${data.author?.id}> can't find the file sorry :(`
                    });
                } else if (payload === 'not null') {
                    restActions.sendMessage({
                        channelId: data.channel_id,
                        messageReference: {
                            channel_id: data.channel_id,
                            message_id: data.id,
                            guild_id: data.guild_id
                        },
                        message: `<@!${data.author?.id}> this command is out of order, I have pinged my master. Sorry for the inconvenience :(`
                    });
                } else {
                    let messageData = {
                        channelId: data.channel_id,
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
    }

    let getDescription = function(exact) {
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

    var processEmoji = function(data, args) {
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
                              `${prefix}emoji delete <emoji>, this command is to delete the emoji, <emoji> is just the emoji you want to delete\n\`\`\``
            restActions.sendMessage({
                channelId: data.channel_id,
                embed: {
                    color: 16731558,
                    description: description
                }
            });
            return;
        }

        if (firstArg == 'delete') {
            let splitSecondArg = splitArgs[1].split(':');
            if (splitSecondArg.length != 3) {
                invalidCommands(data);
            }
            let emojiId = splitSecondArg[2].substring(0, splitSecondArg[2].length - 1);
            if(!isNaN(parseInt(emojiId))) {
                restActions.deleteEmoji(data.guild_id, emojiId, (response, callbackParams) => {
                    if (callbackParams.emojiId == emojiId && callbackParams.guildId == data.guild_id) {
                        restActions.sendMessage({
                            channelId: data.channel_id,
                            message: `Emoji deleted`
                        })
                    }
                });
            }
            return;
        }

        emojiName = firstArg;

        let imageData = data.attachments[0];
        function mainEmojiProcessor(buffer) {
            fileType.fromBuffer(buffer).then((o) => {
                if (validMimes.indexOf(o.mime) > -1) {
                    let base64image = buffer.toString('base64');
                    restActions.registerEmoji({
                        name: emojiName.split('"').join('').split(':').join(''),
                        image: `data:${o.mime};base64,${base64image}`,
                        channelId: data.channel_id,
                        guildId: data.guild_id,
                        messageId: data.id,
                        callback: (data, options) => {
                            if (data.id != null) {
                                restActions.sendMessage({
                                    channelId: options.channelId,
                                    message: `Emoji added <:${data.name}:${data.id}>`
                                })
                            }
                        }
                    })
                }
            })
        }
        //#endregion websocket complex processes

        restActions.getImage(imageData.url, (buffer) => {
            if (Buffer.byteLength(buffer) > maxImageSize) {
                imageTooHuge(data);
            }
            mainEmojiProcessor(buffer);
        })
    }

    return messageLog;
}

exports.mainProcess = mainProcess;
