const usagiConstants = require("./usagi.constants").USAGI_CONSTANTS;
const slashCommandInit = require('./slash-commands');

const { uiMessageLogs } = require('./message-logs-storage');
const { EVENT_TYPES } = require('./event-types');

let socket = null;
let end = false;

exports.end = function() {
    end = true;
    socket.close();
}

let mainProcess = function() {
    const zlib = require("zlib");
    const WebSocket = require('ws');

    const tempRepositoryFunc = require('./temp-repository');
    const realTimeRepository = tempRepositoryFunc.realTimeRepository;

    slashCommandInit.initSlashCommand();

    var triedResuming = false;

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
            name: 'with Shiva',
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

    socket = new WebSocket(`wss://gateway.discord.gg/?v=${discordGatewayVersionNumber}&encoding=${encoding}`);

    socket.sendCustom = function (data, callback) {
        if (socket.readyState === WebSocket.OPEN) {
            callback = callback || ((err) => { });
            this.send(JSON.stringify(data), callback);
        }
    }

    socket.onopen = function (e) {
        console.log('CONNECTED!');
    };

    socket.onmessage = async function (msg) {
        if (msg.data != null) {
            let data = JSON.parse(msg.data);
            await matchOpCode(data);
        }
        //decompressMessaege(msg, processMessage);
    };

    socket.onclose = function (event) {
        if (!end && socket.readyState === WebSocket.CLOSED) {
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

    var matchOpCode = async function (data) {
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
                await matchType(data);
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

    var matchType = async function (data) {
        if (EVENT_TYPES[data.t] != null) {
            EVENT_TYPES[data.t].process(data);
        }
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

    return uiMessageLogs;
}

exports.mainProcess = mainProcess;