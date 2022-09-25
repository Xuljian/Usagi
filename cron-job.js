const repository = require('./temp-repository').realTimeRepository;
const parser = require('cron-parser');
const moment = require('moment');
const restActions = require('./rest-actions');
const { timeoutChainer } = require('./utils/timeout-chainer');
let end = false;

let loopy = timeoutChainer(() => {
    if (!repository.fileInit || !repository.hasInit) {
        return;
    }
    if (repository.jobs.length > 0) {
        repository.jobs.forEach((job, index) => {
            if (job.cron != null && job.channelId != null && job.guildId != null && job.message != null) {
                let cron  = parser.parseExpression(job.cron, {
                    utc: true
                });
                // Should not be false
                // On register the cron should have been validated
                // Unless expired
                if (validCron(cron)) {
                    cron = parser.parseExpression(job.cron, {
                        utc: true
                    });
                    fireCron(cron, job, index);
                } else {
                    delete repository.jobs[index];
                }
            }
        })
    }
    loopy.stop = true;
}, 500)

let fireCron = function(cron, job, index) {
    let currentDate = moment.utc().valueOf();
    let cronNextTime = cron.next().getTime();
    let timeoutId = setTimeout(() => {
        if (repository.jobs[index] != null) {
            const passableIndex = index;
            const passableJob = job;
            if (!end) {
                restActions.sendMessage({
                    message: job.message,
                    channelId: job.channelId,
                    guildId: job.guildId,
                });
            }
            const passableCron = parser.parseExpression(job.cron, {
                utc: true
            });
            if (passableCron.hasNext()) {
                fireCron(passableCron, passableJob, passableIndex);
            }
        } else if (repository[index] == null) {
            delete repository.registeredJobs[index]; 
        }
    }, cronNextTime - currentDate)
    repository.registeredJobs[index] = timeoutId;
}

let validCron = function(cron) {
    if (!cron.hasNext()) {
        return false;
    }
    let firstTime = cron.next().getTime();
    if (cron.hasNext()) {
        let secondTime = cron.next().getTime();
        if (secondTime - firstTime <= 5000) {
            return false;
        }
    }
    return true;
}

// {
//     message: string,
//     cron: string (cron expression),
//     channelId: string,
//     guildId: string
// }
exports.registerCron = function(cronRegistration) {
    if (cronRegistration.cron != null && cronRegistration.channelId != null && cronRegistration.guildId != null && cronRegistration.message != null) {
        try {
            let cron  = parser.parseExpression(cronRegistration.cron, {
                utc: true
            });
            // Should not be true
            // On register the cron should have been 
            if (validCron(cron)) {
                cron = parser.parseExpression(cronRegistration.cron, {
                    utc: true
                });
                let length = repository.jobs.push(cronRegistration);
                fireCron(cron, cronRegistration, length - 1);
            }
        } catch (err) {
            console.log('cron error');
            return 'error';
        }
    }
}

exports.unregisterCron = function(index, channelId) {
    if (repository.jobs[index] != null && repository.jobs[index].channelId == channelId) {
        repository.jobs.splice(index, 1);
        const timeoutId = repository.registeredJobs[index];
        clearTimeout(timeoutId);
        delete repository.registeredJobs[index];
    } else {
        return 'error';
    }
}

exports.getCronList = function(guildId, channelId) {
    return repository.jobs.map((job, index) => {
        if (job != null) {
            job.id = index;
        }
        return job;
    }).filter((job) => {
        return job != null && (guildId == null || guildId == job.guildId) && (channelId == null || job.channelId == channelId);
    })
}

exports.clearCronByChannelId = function(channelId) {
    if (channelId == null) {
        return false;
    }
    repository.jobs = repository.jobs.filter((job) => {
        return job != null && job.channelId != channelId;
    });
    return true;
}

exports.haltCron = function() {
    end = true;
}