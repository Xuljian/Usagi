const tempRepositoryFunc = require('../temp-repository');
const realTimeRepository = tempRepositoryFunc.realTimeRepository;

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

fs.readdirSync(__dirname)
    .filter(file => {
        return file.indexOf('index') == -1 && file.indexOf('.js') > -1;
    }).map(file => {
        return file.substring(0, file.indexOf('.js'));
    }).forEach(file => {
        USAGI_COMMANDS[file] = require(__dirname + '/' + file + '.js');
    })

exports.USAGI_COMMANDS = USAGI_COMMANDS;