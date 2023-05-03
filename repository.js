const fs = require('fs');

var restActions = null;
const { USAGI_CONSTANTS } = require('./usagi.constants');
const { timeoutChainer } = require('./utils/timeout-chainer');

const dumpFilePath = USAGI_CONSTANTS.BOT_DUMP_PATH + '\\dump.txt';

const { log } = require('./utils/logger');

var hasChanges = true;

let realTimeRepository = {
    guilds: {},
    users: {},
    channels: {},
    bots: {},
    hasInit: false,
    fileInit: false,
    hasRegisteredCommand: false,
    commandVersion: null,
    debug: false,
    channelIgnore: [],
    guildIgnore: [],
    emojiChannel: [],
    archiveChannel: {},
    archiveListenChannel: {},
    jobs: [],
    registeredJobs: {},
    resumeData: {
        sequenceId: null,
        sessionId: null
    }
}

exports.realTimeRepository = realTimeRepository;

var registerUsersFromGuilds = function () {
    if (Object.keys(realTimeRepository.guilds).length > 0) {
        let guilds = realTimeRepository.guilds;
        for (var key in guilds) {
            if (Object.prototype.hasOwnProperty.call(guilds, key)) {
                if (guilds[key] != null && guilds[key].members != null) {
                    guilds[key].members.forEach((o) => {
                        if (o.user != null) {
                            let user = o.user;
                            if (realTimeRepository.users[user.id] == null) {
                                if (user.bot) {
                                    realTimeRepository.bots[user.id] = user;
                                } else {
                                    realTimeRepository.users[user.id] = user;
                                }
                            }
                        }
                    });
                }
                if (guilds[key] != null && guilds[key].channels != null) {
                    guilds[key].channels.forEach((o) => {
                        if (realTimeRepository.channels[o.id] == null) {
                            realTimeRepository.channels[o.id] = o;
                        }
                    });
                }
            }
        }
    }
}

let getEsentialData = function() {
    return {
        guilds: realTimeRepository.guilds,
        users: realTimeRepository.users,
        channels: realTimeRepository.channels,
        bots: realTimeRepository.bots,
        hasInit: realTimeRepository.hasInit,
        fileInit: realTimeRepository.fileInit,
        hasRegisteredCommand: realTimeRepository.hasRegisteredCommand,
        commandVersion: realTimeRepository.commandVersion,
        channelIgnore: realTimeRepository.channelIgnore,
        emojiChannel: realTimeRepository.emojiChannel,
        guildIgnore: realTimeRepository.guildIgnore,
        archiveChannel: realTimeRepository.archiveChannel,
        archiveListenChannel: realTimeRepository.archiveListenChannel,
        jobs: realTimeRepository.jobs,
        resumeData: realTimeRepository.resumeData
    };
}

exports.getEsentialData = getEsentialData;

let getData = function () {
    if (realTimeRepository.debug)
        return JSON.stringify(getEsentialData(), null, 4);
    return JSON.stringify(getEsentialData());
}

exports.getGuildName = function (id) {
    return realTimeRepository.guilds[id]?.name;
}

exports.hasListenerForArchive = function(guilId, channelId) {
    let guildListener = realTimeRepository.archiveListenChannel[guilId];
    if (guildListener == null) {
        return false;
    } else {
        return guildListener.indexOf(channelId) > -1;
    }
}

exports.archiveChannel = function(guildId) {
    return realTimeRepository.archiveChannel[guildId];
}

exports.userAllowKick = function (guildId, executorId) {
    let guilds = realTimeRepository.guilds;
    let happeningGuild = guilds[guildId];
    if (happeningGuild == null) {
        return false;
    }

    if (happeningGuild.members == null || happeningGuild.members.length == 0) {
        return false;
    }

    let result = false;
    let roles = [];
    happeningGuild.members.forEach((o) => {
        if (roles.length == 0 && o.user != null && o.user.id == executorId) {
            roles = o.roles;
        }
    });

    if (roles.length == 0) {
       roles.push(happeningGuild.roles[0].id); 
    }

    if (roles != null && roles.length > 0) {
        if (happeningGuild.roles != null && happeningGuild.roles.length > 0) {
            happeningGuild.roles.forEach((i) => {
                if (!result) {
                    roles.forEach((a) => {
                        if (!result && i.id == a) {
                            let permissionBit = USAGI_CONSTANTS.PERMISSIONS.ADMINISTRATOR + USAGI_CONSTANTS.PERMISSIONS.KICK_MEMBERS;
                            if ((permissionBit & i.permissions) > 0) {
                                result = true;
                            }
                        }
                    })
                }
            });
        }
    }
    return result;
}

var updateGuilds = function () {
    restActions = restActions || require('./rest-actions');
    let guilds = realTimeRepository.guilds;
    for (var key in guilds) {
        if (Object.prototype.hasOwnProperty.call(guilds, key)) {
            if (guilds[key] != null) {
                restActions.refreshGuildDetails(key, (data) => {
                    guilds[data.id] = data;
                    restActions.refreshGuildMembers(data.id, (subData, callbackParams) => {
                        guilds[callbackParams].members = subData;
                        restActions.refreshGuildChannels(callbackParams, (subSubData, callbackParams) => {
                            guilds[callbackParams].channels = subSubData;
                            hasChanges = true;
                        })
                    })
                })
            }
        }
    }
}

var exportToFile = function (forced, callback) {
    if (hasChanges || forced) {
        fs.writeFile(dumpFilePath, getData(), 'utf8', callback || ((a, b) => {
            if (a) {
                log(a);
                return;
            }
        }))
        hasChanges = false;
    }
}

var importFromFile = function () {
    fs.readFile(dumpFilePath, 'utf8', (error, content) => {
        if (error) {
            log(error);
            realTimeRepository.fileInit = true;
            return;
        }
        if ((content || '').trim() == '') {
            realTimeRepository.fileInit = true;
            return;
        }
        let repo = JSON.parse(content);
        realTimeRepository.bots = repo.bots;
        realTimeRepository.guilds = repo.guilds;
        realTimeRepository.channels = repo.channels;
        realTimeRepository.users = repo.users;
        realTimeRepository.channelIgnore = repo.channelIgnore;
        realTimeRepository.emojiChannel = repo.emojiChannel || [];
        realTimeRepository.archiveChannel = repo.archiveChannel || {};
        realTimeRepository.archiveListenChannel = repo.archiveListenChannel || {};
        realTimeRepository.hasRegisteredCommand = repo.hasRegisteredCommand;
        realTimeRepository.commandVersion = repo.commandVersion;
        realTimeRepository.jobs = repo.jobs || [];
        realTimeRepository.fileInit = true;
        realTimeRepository.guildIgnore = repo.guildIgnore;
        realTimeRepository.resumeData = repo.resumeData || {
            sequenceId: null,
            sessionId: null
        }
    })
}
importFromFile();

let loopers = null;

let intervalReady = timeoutChainer(() => {
    if (realTimeRepository.fileInit) {
        loopers = [
            timeoutChainer(registerUsersFromGuilds, 1000),
            //timeoutChainer(updateGuilds, 10000),
            timeoutChainer(exportToFile, 5000),
            timeoutChainer(checkDebug, 5000),
        ]
        intervalReady.stop = true;
    }
});

let checkDebug = async function() {
    let init = realTimeRepository.debug;
    if (fs.existsSync(USAGI_CONSTANTS.BOT_DUMP_PATH + "\\debug")) {
        realTimeRepository.debug = true;
    } else {
        realTimeRepository.debug = false;
    }
    if (init != realTimeRepository.debug) {
        if (realTimeRepository.debug) {
            log("Debug enabled");
        } else {
            log("Debug disabled");
        }
    }
}

let cleanupRepository = function() {
    delete realTimeRepository.registeredJobs;
    // if this is called means the program is asked to "end" so the resume data is not needed because we do not know when it will come back on 
    realTimeRepository.resumeData = {
        sequenceId: null,
        sessionId: null
    }
    realTimeRepository.jobs = realTimeRepository.jobs.filter((job) => {
        return job != null;
    })
}

exports.onClose = function(ignoreDB, forced, callback) {
    cleanupRepository();
    if (loopers != null) {
        loopers.forEach(looper => { looper.stop = true; });
    }
    if (!ignoreDB)
        exportToFile(forced, callback);
    else
        callback != null && callback();
}