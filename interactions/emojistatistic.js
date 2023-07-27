const command = require('../commands/emojistatistic');

exports.slashCommandRegistrationObj = {
    type: 1,
    name: "emojistatistic",
    description: "Statistic of usage for emojis"
}

exports.process = function(data) {
    command.process(data);
}