const restActions = require('../rest-actions');
const getTag = require('../utils/common').getTag;
const usagiConstants = require("../usagi.constants").USAGI_CONSTANTS;

const { log } = require('../utils/logger');

const prefix = usagiConstants.BOT_DATA.COMMAND_PREFIX;

exports.process = function(data, args) {
    if (args == null || args === '' || args === '?') {
        let description = '**Using Math\n\n**' +
                            `\`\`${prefix}math <expression>\`\`\n\n` +
                            'This command is to do....well math!\n' +
                            '<expression> is the math you want to do.' +
                            '\`\`\`+ for addition\n' +
                            '- for subtraction\n' +
                            '* for multiplication\n' +
                            '** for exponential\n' + 
                            '/ for division\n' +
                            'in for searching existence of a string\`\`\`\n' +
                            'Example.\n' + 
                            `\`\`\`${prefix}math 1+1\n` +
                            `${prefix}math 1+1+2+3/3*4**6 (got no idea the answer why don't you try out? Expression as complex as this works too)\n` +
                            `${prefix}math "hello" in "hello world" (this will search hello in hello world and will highlight the left hand side word in the right hand side word)\`\`\``
        restActions.sendMessage({
            interactionId: data.id,
            interactionToken: data.token,
            guildId: data.guild_id,
            channelId: data.channel_id,
            embed: {
                color: usagiConstants.BOT_DATA.EMBED_COLOR_HEX,
                description: description
            }
        });
        return true;
    }
    try {
        let result = scopeEval(args);
        if (result == null || result.result == null ||
            (!result.isIn && isNaN(result.result))) {
            return false;
        }
        if (result.isIn) {
            restActions.sendMessage({
                interactionId: data.id,
                interactionToken: data.token,
                guildId: data.guild_id,
                channelId: data.channel_id,
                message: `${result.result}`,
                messageReference: {
                    channel_id: data.channel_id,
                    message_id: data.id,
                    guild_id: data.guild_id
                },
            });
            return true;
        }
        restActions.sendMessage({
            interactionId: data.id,
            interactionToken: data.token,
            guildId: data.guild_id,
            channelId: data.channel_id,
            message: `${getTag(data.author?.id)} Your equation: ${args}\nThe result: ${result.result}`.trim()
        });
        return true;
    } catch (e) {
        log(e);
        return false;
    }
}

let scopeEval = function (evalString) {
    let cleanScope = {};
    return function () {
        'use strict'
        if (checkIn(evalString)) {
            let res = processIn(evalString);
            if (res != null) {
                return {
                    result: res,
                    isIn: true
                };
            }
        }
        evalString = evalString.split('[').join('(');
        evalString = evalString.split(']').join(')');
        evalString = evalString.split('{').join('(');
        evalString = evalString.split('}').join(')');
        evalString = evalString.split(' ').join('');
        evalString = evalString.split('\\').join('');
        let mathRegex = /^[+\-/*\.\d\(\)]+$/;

        if (mathRegex.exec(evalString) == null) {
            throw 'Invalid math operations';
        }
        return {
            result: eval(evalString),
            isIn: false
        };
    }.bind(cleanScope)();
}

let checkIn = function(string) {
    string = (string || '').trim();
    if (string.indexOf('in') > -1) {
        return true;
    }
    return false;
}

let processIn = function(string) {
    string = (string || '').trim();
    string = string.split('*').join('');
    let splitted = string.split('in');
    if (splitted.length >= 2) {
        let firstString = splitted.shift().trim();
        let secondString = splitted.join('in').trim();
        if (firstString[0] === '\"' && firstString[firstString.length - 1] === '\"' && secondString[0] === '\"' && secondString[secondString.length - 1] === '\"') {
            let newFirst = JSON.stringify(firstString.substring(1, firstString.length - 1));
            let regexString = JSON.stringify(newFirst.substring(1, newFirst.length - 1));
            let newSecond = JSON.stringify(secondString.substring(1, secondString.length - 1));
            let regex = new RegExp(`(${regexString.substring(1, regexString.length - 1)})`, 'g');
            log(`(${regexString.substring(1, regexString.length - 1)})`);
            let result = newSecond.replace(regex, '**$1**');
            result = eval(result.replace(/\*\*\*\*/g, ''));
            if (result.indexOf('*') > -1) {
                return result;
            }
            return "No matching strings found :(";
        }
    }
    return null;
}