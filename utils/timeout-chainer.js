/*
 * work is a function to do the work for
 * intervals can be a function or a number
 * number is in MS for when it should re-execute
 * function must return a number in MS for when it should re-execute
 * firstExecute is a boolean to know if it needs to immediately execute it the first time
 */
exports.timeoutChainer = function (work, intervals, firstExecute) {
    let internalIntervals = intervals;
    if ((typeof intervals) !== "function") {
        internalIntervals = () => {
            return intervals;
        }
    }

    if (firstExecute || false) {
        setTimeout(async () => {
            await work();
            clearTimeout(timeout);
        }, 0)
    }

    let timeout = null;
    let stopper = {
        stop: false
    }
    let internalLooper = () => {
        console.log(internalIntervals())
        timeout = setTimeout(async () => {
            await work();
            clearTimeout(timeout);
            if (!stopper.stop)
                internalLooper();
        }, internalIntervals() || 500)
    }
    internalLooper();
    return stopper;
}