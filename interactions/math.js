const command = require('../commands/math');

exports.slashCommandRegistrationObj = {
    type: 1,
    name: "math",
    description: "Calculate the equation given",
    options: [{
        type: 3,
        name: "equation",
        description: "The equation to calculate",
        required: false
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
            if (options[0].name === "equation") {
                argString += options[0].value;
            }
        }
    }
    return argString;
}