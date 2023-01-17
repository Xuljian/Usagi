const command = require('../commands/random');

exports.slashCommandRegistrationObj = {
    type: 1,
    name: "random",
    description: "Generate a random number based off minimum and maximum provided",
    options: [{
        type: 3,
        name: "min",
        description: "The minimum value (inclusive)",
        required: false
    },{
        type: 3,
        name: "max",
        description: "The maximum value (inclusive)",
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
        if (options.length == 2) {
            argString = " ";
            options.forEach((o) => {
                if (o.name === "min") {
                    argString = o.value + argString;
                } else if (o.name === "max") {
                    argString = argString + o.value;
                }
            })
        }
    }
    return argString;
}