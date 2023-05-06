const command = require('../commands/twitter');

exports.slashCommandRegistrationObj = {
    name: "twitter",
    description: "Register the current channel to have updates from a twitter Url",
    options: [{
        type: 2,
        name: "action",
        description: "Action for the command, applicable values are \"register\" and \"unregister\"",
        options: [{
            type: 1,
            name: "register",
            description: "To subscribe to a twitter Url for updates",
            options: [{
                type: 3,
                name: "url",
                description: "The twitter URL to be subscribed/unsubscribed",
                required: true
            }]
        }, {
            type: 1,
            name: "unregister",
            description: "To unsubscribe a Url for updates",
            options: [{
                type: 3,
                name: "url",
                description: "The twitter URL to be subscribed/unsubscribed",
                required: true
            }]
        }]
    }, {
        type: 1,
        name: "help",
        description: "Display detailed help",
    }]
}

let resolveArgumentString = function(obj) {
    let action = null;
    let val = null;
    action = obj.options[0]?.name;
    val = obj.options[0]?.options[0]?.value;
    if (val == null || action == null) return null;
    
    return action + " " + val;
}

exports.processOptions = function(data) {
    if (data.data?.options != null) {
        let options = data.data.options;
        if (options.length == 1) {
            switch (options[0].name) {
                case "help": {
                    return null;
                }
                case "action": {
                    return resolveArgumentString(options[0]);
                }
            }
        }
    }
}

exports.process = function(usableData, args) {
    command.process(usableData, args);
}