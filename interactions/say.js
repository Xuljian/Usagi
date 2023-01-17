const command = require('../commands/say');

exports.slashCommandRegistrationObj = {
    type: 1,
    name: "say",
    description: "Make me say stuff",
    options: [{
        type: 3,
        name: "sentence",
        description: "The sentence you want me to say",
        required: true
    }]
}

exports.process = function(data, args) {
    command.process(data, args);
}

exports.processOptions = function(data) {
    let argString = null;
    if (data.data?.options != null) {
        let options = data.data.options;
        if (options.length == 1) {
            argString = "";
            if (options[0].name === "sentence") {
                argString += options[0].value;
            }
        }
    }
    return argString;
}