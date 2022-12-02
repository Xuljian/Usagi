const restActions = require('./rest-actions');
const tempRepositoryFunc = require('./temp-repository');
const repository = tempRepositoryFunc.realTimeRepository;
const { timeoutChainer } = require('./utils/timeout-chainer');

let version = "1.0.0";

let slashCommandObjs = [
    {
        type: 1,
        name: "help",
        description: "Displays the available commands for Usagi"
    },
    {
        type: 1,
        name: "math",
        description: "Calculate the equation given",
        options: [{
            type: 3,
            name: "equation",
            description: "The equation to calculate",
            required: false
        }]
    },
    {
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
]

exports.initSlashCommand = function() {
    let looper = timeoutChainer(() => {
        if (!repository.fileInit) {
            return;
        }

        if (repository.hasRegisteredCommand && repository.commandVersion === version) {
            looper.stop = true;
            return;
        }

        console.log("Registering commands");

        repository.commandVersion = version;

        restActions.bulkUpdateSlashCommand(slashCommandObjs, () => {
            repository.hasRegisteredCommand = true;
        });

        looper.stop = true;
    }, 500);
}