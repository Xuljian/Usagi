const tempfs = require('fs');
const fs = tempfs.promises;

const { By, Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const { USAGI_CONSTANTS } = require('../usagi.constants'); 
const { sleeper } = require('../utils/sleeper');
const { timeoutChainer } = require('../utils/timeout-chainer');
const { realTimeRepository } = require('../repository');

const { Mutex } = require('async-mutex');

const restActions = require('../rest-actions');

let cache = {};

const chromeOptions = new chrome.Options();
chromeOptions.addArguments("headless");
const prefix = USAGI_CONSTANTS.BOT_DATA.COMMAND_PREFIX;

const twitterBaseUrl = 'https://twitter.com/';

let cacheMutex = new Mutex();

let tasks = [];

let invalidChannels = [];

let twitterUrlObjs = [];

let getId = function(url) {
    let regStr = /.*\/status\/(\d+)/
    let res = regStr.exec(url);
    return res[1];
}

let signOnKiller = async function(driver) {
    await driver.executeScript("document.querySelector('div[data-testid=\"BottomBar\"]').remove()");
}

let notificationKiller = async function(driver) {
    let elements = await driver.findElements(By.css('div[data-testid=\"sheetDialog\"]'));

    if (elements.length > 0) {
        let el = await elements[0].findElement(By.css('div > div > div:first-child > div > div > svg'))
        await el.click();
        await sleeper(1000);
    }
}

let postScrapeCleaner = async function() {
    await cacheMutex.runExclusive(() => {
        Object.keys(cache).forEach((url) => {
            // First pass to check if this URL has any registered server
            let serverIds = Object.keys(cache[url])
                .filter((key) => {
                    return key !== "pinned" && key !== "lastId";
                });
            
            // if no servers are registered erase the url and return
            if (serverIds.length == 0) {
                delete cache[url];
                tasks[url].stop = true;
                delete tasks[url];
                return;
            }
            
            // loop through the servers and erase the servers from cache if there are no channels
            serverIds.forEach((serverId) => {
                let ids = cache[url][serverId].channelIds;
                if (ids.length == 0) {
                    delete cache[url][serverId];
                }
            })

            // Second pass to check if this URL has any registered server
            serverIds = Object.keys(cache[url])
                .filter((key) => {
                    return key !== "pinned" && key !== "lastId";
                });

            // if no servers are registered erase the url and return
            if (serverIds.length == 0) {
                delete cache[url];
                tasks[url].stop = true;
                delete tasks[url];
                return;
            }
        })
    })
}

let init = async function() {
    tasks["cleaner"] = timeoutChainer(async () => {
        if (invalidChannels.length > 0) {
            await cacheMutex.runExclusive(() => {
                invalidChannels.forEach((obj) => {
                    Object.keys(cache).forEach((url) => {
                        let ids = cache[url][obj.serverId].channelIds;
                        ids.splice(ids.indexOf(obj.channelId), 1);
                        if (ids.length == 0) {
                            delete cache[url][serverId];
                        }
                    })
                })
                invalidChannels = [];
            })
        }
    }, 1000);

    tasks["send"] = timeoutChainer(sendToAllServers, 500);

    let temp = timeoutChainer(() => {
        if (!realTimeRepository.fileInit) return;
        
        cache = realTimeRepository.twitterModule;
        temp.stop = true;
        let urls = Object.keys(cache);
        for (let x = 0; x != urls.length; x++) {
            let url = urls[x];
            if (cache[url].pinned == null) {
                cache[url].pinned = [];
            }

            let chainer = timeoutChainer(async () => {
                await scrape(url);
            }, 300000, true);
            
            tasks[url] = chainer;
        }
    }, 1000);
}

let registerTasks = function(url) {
    if (!realTimeRepository.fileInit) return;
        
    if (cache == null) {
        cache = realTimeRepository.twitterModule;
    }

    if (tasks[url] != null) {
        return;
    }

    if (cache[url].pinned == null) {
        cache[url].pinned = [];
    }

    let chainer = timeoutChainer(async () => {
        await scrape(url);
    }, 60000, true);
    tasks[url] = chainer;
}

let getArticleUrl = async function(article) {
    let anchorEl = await article.findElement(By.css("a[href*=\"status\"]"));
    let artUrl = await anchorEl.getAttribute("href");
    return artUrl;
}

// Workaround for handling webdriver issue with temp files not deleted
let cleanup = async function() {
    let folders = tempfs.readdirSync(process.env.LOCALAPPDATA + "/temp")
        .filter((folder) => {
            return /scoped\_dir.*/.exec(folder) != null;
        }).map((folder) => {
            return process.env.LOCALAPPDATA + "/temp/" + folder;
        });
    
    for (let x = 0; x != folders.length; x++) {
        await fs.rm(path, { force: true, recursive: true });
    }
}

// Proper URL cleanup if there are new stuff on twitter following
let sendToAllServers = async function() {
    if (twitterUrlObjs.length == 0) return;
    
    let args = twitterUrlObjs.shift();
    let twitterUrlObj = args.twitterUrlObj;
    let url = args.artUrl;

    await cacheMutex.runExclusive(() => {
        let keys = Object.keys(twitterUrlObj)
            .filter((key) => {
                return key !== "pinned" && key !== "lastId";
            });

        keys.forEach((serverId) => {
            if (twitterUrlObj[serverId] == null) {
                return;
            }
            if (twitterUrlObj[serverId].channelIds.length == 0) {
                delete twitterUrlObj[serverId];
                return;
            }
            twitterUrlObj[serverId].channelIds.forEach((channelId) => {
                restActions.sendMessage({
                    guildId: serverId,
                    channelId: channelId,
                    message: url,
                    callback: (res) => {
                        if (res.error && res.status == 404) {
                            // not deadlock
                            cacheMutex.runExclusive(() => {
                                invalidChannels.push({serverId: serverId, channelId: channelId});
                            });
                        }
                    }
                });
            })
        })
    });
}

exports.process = function(data, args) {
    if (args == null || args === '' || args === '?' || args.trim() === 'help') {
        let description = '**Using Twitter\n\n**' +
                            `\`\`${prefix}twitter <command> <url>\`\`\n\n` + 
                            'This command is for getting any updates from a twitter page.\n' +
                            'If there are changes in \"Pinned\" tweet it will also be picked up\n\n' +
                            '<command> refers to either \"register\" or \"unregister\"\n' +
                            '<url> refers to the url of the twitter account\n' + 
                            'Example Url:\n' + 
                            'https://twitter.com/NASA - for NASA\'s twitter\n\n' + 
                            'Example usage:\n' +
                            `\`\`${prefix}twitter register https://twitter.com/NASA\`\`\n\n`
                            
        restActions.sendMessage({
            interactionId: data.id,
            interactionToken: data.token,
            guildId: data.guild_id,
            channelId: data.channel_id,
            embed: {
                color: USAGI_CONSTANTS.BOT_DATA.EMBED_COLOR_HEX,
                description: description
            }
        });
        return true;
    }
    let testUrlRegex = new RegExp(twitterBaseUrl + "[A-Za-z0-9\\_]+")
    let argArr = args.split(" ");
    let action = argArr.shift();
    let parameters = argArr.join(" ");
    switch (action) {
        case "register": {
            let url = parameters;
            let result = testUrlRegex.exec(url);
            if (result == null) {
                restActions.sendMessage({
                    interactionId: data.id,
                    interactionToken: data.token,
                    guildId: data.guild_id,
                    channelId: data.channel_id,
                    message: "Invalid Url. Expected Url is something that looks like \'https://twitter.com/<the_person_you_following>\'"
                });
                return true;
            }
            cacheMutex.runExclusive(() => {
                if (cache[url] == null) {
                    cache[url] = {};
                }
                if (cache[url][data.guild_id] == null) {
                    cache[url][data.guild_id] = {
                        channelIds: []
                    }
                }
                if (cache[url][data.guild_id].channelIds.indexOf(data.channel_id) > -1) {
                    restActions.sendMessage({
                        interactionId: data.id,
                        interactionToken: data.token,
                        guildId: data.guild_id,
                        channelId: data.channel_id,
                        message: `Already registered`
                    });
                    return;
                }
                cache[url][data.guild_id].channelIds.push(data.channel_id);
                registerTasks(url);
                restActions.sendMessage({
                    interactionId: data.id,
                    interactionToken: data.token,
                    guildId: data.guild_id,
                    channelId: data.channel_id,
                    message: `Successfully registered ${url}`
                });
            });
            break;
        }
        case "unregister": {
            let url = parameters;
            let result = testUrlRegex.exec(url);
            if (result == null) {
                restActions.sendMessage({
                    interactionId: data.id,
                    interactionToken: data.token,
                    guildId: data.guild_id,
                    channelId: data.channel_id,
                    message: "Invalid Url. Expected Url is something that looks like \'https://twitter.com/<the_person_you_following>\'"
                });
                return;
            }
            cacheMutex.runExclusive(() => {
                if (cache[url] == null || cache[url][data.guild_id] == null || cache[url][data.guild_id].channelIds.indexOf(data.channel_id) === -1) {
                    restActions.sendMessage({
                        interactionId: data.id,
                        interactionToken: data.token,
                        guildId: data.guild_id,
                        channelId: data.channel_id,
                        message: `Url is not registered`
                    });
                    return;
                }

                let channelIds = cache[url][data.guild_id].channelIds;
                channelIds.splice(channelIds.indexOf(data.channel_id), 1);
                restActions.sendMessage({
                    interactionId: data.id,
                    interactionToken: data.token,
                    guildId: data.guild_id,
                    channelId: data.channel_id,
                    message: `Successfully unregistered ${url}`
                });
            });
            break;
        }
    }
    return true;
}


let scrape = async function(url) {
    const chromeService = new chrome.ServiceBuilder(USAGI_CONSTANTS.CHROME_DRIVER_PATH);
    let driver = new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .setChromeService(chromeService)
        .build();

    await driver.get(url);
    await sleeper(USAGI_CONSTANTS.SCRAPE_WAIT_TIME * 1000);

    await notificationKiller(driver);
    await signOnKiller(driver);

    let visitedArticles = [];

    let foundId = false;

    let fullPinned = [];

    while (!foundId) {
        let articles = await driver.findElements(By.css("article"));

        for (let y = 0; y != articles.length; y++) {
            let article = articles[y]; 
            let articleId = await article.getId();
            if (visitedArticles.indexOf(articleId) > -1) {
                continue;
            }

            let innerTxt = await article.getAttribute("innerText");

            if (innerTxt.startsWith("Pinned Tweet")) {
                // check pinned tweet storage instead
                await notificationKiller(driver);

                let artUrl = await getArticleUrl(article);
                let id = getId(artUrl);

                fullPinned.push(id);

                if (cache[url].pinned.indexOf(id) == -1) {
                    twitterUrlObjs.push({twitterUrlObj: cache[url], artUrl: artUrl});
                }
            } else {
                let artUrl = await getArticleUrl(article);
                let id = getId(artUrl);

                if (cache[url].lastId != id) {
                    cache[url].lastId = id;
                    twitterUrlObjs.push({twitterUrlObj: cache[url], artUrl: artUrl});
                }

                foundId = true;
                break;
            }
        }

        if (!foundId) {
            await driver.executeScript('arguments[0].scrollIntoView(true, {behavior:"instant"})', articles[articles.length - 1]);
            await sleeper(500);
        }
    }

    cache[url].pinned = fullPinned;

    await driver.close();

    await driver.quit();

    await cleanup();

    await postScrapeCleaner();
}

let end = function() {
    if (tasks != null) {
        Object.keys(tasks).forEach(i => {
            tasks[i].stop = true;
        });
        cache = null;
    }
}

init();

exports.end = end;