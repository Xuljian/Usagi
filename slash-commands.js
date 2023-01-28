const restActions = require('./rest-actions');
const tempRepositoryFunc = require('./temp-repository');
const repository = tempRepositoryFunc.realTimeRepository;
const { timeoutChainer } = require('./utils/timeout-chainer');

const { USAGI_INTERACTIONS } = require('./interactions');

const { log } = require('./utils/logger');

let version = "1.0.1";

const AVAILABLE_SLASH_COMMANDS = Object.keys(USAGI_INTERACTIONS);
exports.AVAILABLE_SLASH_COMMANDS = AVAILABLE_SLASH_COMMANDS;

let slashCommandObjs = Object.keys(USAGI_INTERACTIONS).map((key) => {
    return USAGI_INTERACTIONS[key].slashCommandRegistrationObj;
});

exports.initSlashCommand = function() {
    let looper = timeoutChainer(() => {
        if (!repository.fileInit) {
            return;
        }

        if (repository.hasRegisteredCommand && repository.commandVersion === version) {
            looper.stop = true;
            return;
        }

        log("Registering commands");

        repository.commandVersion = version;

        restActions.bulkUpdateSlashCommand(slashCommandObjs, () => {
            repository.hasRegisteredCommand = true;
        });

        looper.stop = true;
    }, 500);
}