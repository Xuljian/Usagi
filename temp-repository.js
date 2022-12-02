const fs = require('fs');

const dumpFilePath = 'C:\\Data\\UsagiBotDump\\dump.txt';

var restActions = null;
const { USAGI_CONSTANTS } = require('./usagi.constants');
const { timeoutChainer } = require('./utils/timeout-chainer');

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
    return tempRepo = {
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

var prettyPrintData = function () {
    return JSON.stringify(getEsentialData(), null, 4);
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
        fs.writeFile(dumpFilePath, prettyPrintData(), 'utf8', callback || ((a, b) => {
            if (a) {
                console.log(a);
                return;
            }
        }))
        hasChanges = false;
    }
}

var importFromFile = function () {
    fs.readFile(dumpFilePath, 'utf8', (a, b) => {
        if (a) {
            realTimeRepository.fileInit = true;
            return;
        }
        if ((b || '').trim() == '') {
            realTimeRepository.fileInit = true;
            return;
        }
        let repo = JSON.parse(b);
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

let intervalReady = timeoutChainer(() => {
    if (realTimeRepository.fileInit) {
        timeoutChainer(registerUsersFromGuilds, 1000);
        timeoutChainer(updateGuilds, 10000);
        timeoutChainer(exportToFile, 5000);
        intervalReady.stop = true;
    }
});

let cleanupRepository = function() {
    delete realTimeRepository.registeredJobs;
    realTimeRepository.resumeData = {
        sequenceId: null,
        sessionId: null
    }
    realTimeRepository.jobs = realTimeRepository.jobs.filter((job) => {
        return job != null;
    })
}

exports.onClose = function(forced, callback) {
    cleanupRepository();
    exportToFile(forced, callback);
}