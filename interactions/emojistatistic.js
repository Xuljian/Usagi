const command = require('../commands/emojistatistic');

exports.slashCommandRegistrationObj = {
    type: 1,
    name: "emojistatistic",
    description: "Statistic of usage for emojis",
    options: [{
        type: 5,
        name: "reset",
        description: "Do you want to reset this server's statistic?",
        required: false
    },{
        type: 5,
        name: "help",
        description: "Display more details about this command",
        required: false
    }]
}

exports.process = function(data, args) {
    command.process(data, args);
}

exports.processOptions = function(data) {
    let isReset = false;
    let isHelp = false;
    if (data.data?.options != null) {
        let options = data.data.options;
        for (let x = 0; x != options.length; x++) {
            if (options[x].name === "reset" && options[x].value === true) {
                isReset = true;
            } else if (options[x].name === "help" && options[x].value === true) {
                isHelp = true;
            }
        }
    }
    if (isHelp) {
        return "?";
    }
    if (isReset) {
        return "reset";
    }
    return null;
}