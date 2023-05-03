/*
 * work is a function to do the work for
 * intervals can be a function or a number
 * number is in MS for when it should re-execute
 * function must return a number in MS for when it should re-execute
 * firstExecute is a boolean to know if it needs to immediately execute it the first time
 */
exports.timeoutChainer = async function (work, intervals, firstExecute) {
    if ((typeof intervals) !== "function") {
        intervals = () => {
            return intervals;
        }
    }

    if (firstExecute || false) {
        await work();
    }

    let timeout = null;
    let stopper = {
        stop: false
    }
    let internalLooper = () => {
        timeout = setTimeout(async () => {
            await work();
            clearTimeout(timeout);
            if (!stopper.stop)
                internalLooper();
        }, intervals() || 500)
    }
    internalLooper();
    return stopper;
}