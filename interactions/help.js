const command = require('../commands/help');

exports.slashCommandRegistrationObj = {
    type: 1,
    name: "help",
    description: "Displays the available commands for Usagi"
}

exports.process = function(usableData, args) {
    command.process(usableData);
}