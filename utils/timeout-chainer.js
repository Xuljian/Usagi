const { Mutex } = require('async-mutex');
const { sleeper } = require('./sleeper');

let stopperMutex = new Mutex();

let stoppers = [];

/*
 * work is a function to do the work for
 * intervals can be a function or a number
 * number is in MS for when it should re-execute
 * function must return a number in MS for when it should re-execute
 * firstExecute is a boolean to know if it needs to immediately execute it the first time
 */
exports.timeoutChainer = function (work, intervals, firstExecute) {
    let internal = null;
    if ((typeof intervals) !== "function") {
        internal = function () {
            return (intervals || 500);
        }
    } else {
        internal = intervals
    }
    
    let initialComplete = false;
    let timeout = null;
    let stopper = {
        stop: false,
        end: false,
        started: false
    }
    stopperMutex.runExclusive(() => {
        stoppers.push(stopper);
    }).then(() => {
        let internalLooper = () => {
            let interval = internal();
            if (firstExecute && !initialComplete) {
                interval = 0;
                initialComplete = true;
            }
    
            timeout = setTimeout(async () => {
                if (stopper.stop) {
                    stopper.end = true;
                    return;
                }
                stopper.started = true;
                await work();
                stopper.started = false;
                if (!stopper.stop) 
                    internalLooper();
                else
                    stopper.end = true;
            }, interval)
        }
        internalLooper();
    })
    return stopper;
}

exports.end = async function() {
    stoppers.forEach((stopper) => {
        stopper.stop = true;
    })

    while (stoppers.findIndex((val) => !val.end && val.started) > -1) {
        await sleeper(10000);
    }
}