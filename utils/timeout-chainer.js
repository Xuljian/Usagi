exports.timeoutChainer = function (work, intervals) {
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
        }, intervals || 500)
    }
    internalLooper();
    return stopper;
}