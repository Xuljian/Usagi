const tempRepositoryFunc = require('../repository');
const realTimeRepository = tempRepositoryFunc.realTimeRepository;
const { log } = require('../utils/logger');

const fs = require('fs');
let USAGI_COMMANDS = {
    help: require('./help'),
    disable: {
        process: (data, args) => {
            realTimeRepository.guildIgnore.push(data.guild_id);
        }
    },
    enable: {
        process: (data, args) => {
            let index = realTimeRepository.guildIgnore.indexOf(data.guild_id);
            if (index > -1) {
                realTimeRepository.guildIgnore.splice(index, 1);
            }
        }
    },
};

// .js1 basically says that the command file is not ready
fs.readdirSync(__dirname)
    .filter(file => {
        return file.indexOf('index') == -1 && file.indexOf('.js') > -1 && file.indexOf('.js1') === -1;
    }).map(file => {
        return file.substring(0, file.indexOf('.js'));
    }).forEach(file => {
        try {
            USAGI_COMMANDS[file] = require(__dirname + '/' + file + '.js');
        } catch {
            log("Unable to load command file " + file);
        }
    })

let end = function() {
    Object.keys(USAGI_COMMANDS).forEach((command) => {
        if (USAGI_COMMANDS[command].end != null) {
            USAGI_COMMANDS[command].end();
        }
    })
}

exports.USAGI_COMMANDS = USAGI_COMMANDS;
exports.end = end;