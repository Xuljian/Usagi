exports.pso2ModulesReady = false;

require('./pre-process-pso2-modules').preProcessPSO2Modules();

const { Mutex } = require('async-mutex');
let tempfs = require('fs');
let fs = tempfs.promises;

const { USAGI_CONSTANTS } = require('../../usagi.constants');

const allowSearchExtension = ['acb', 'cml'];

const destinationFolder = USAGI_CONSTANTS.BOT_DUMP_PATH;
const pathToList = `${destinationFolder}\\ice_mapped_list.json`;

const pso2win32Path = 'C:\\PHANTASYSTARONLINE2_JP\\pso2_bin\\data\\win32';

let readString = tempfs.readFileSync(pathToList, 'utf-8');
let fileMap = JSON.parse(readString);

let regexExtensions = allowSearchExtension.join('|');

let regexExtension = new RegExp(`^.*\.(?:${regexExtensions})$`);

const allowConversionExtension = 
[
    "fhp", "fnp", "fcp", "fdp",
    "mhp", "mnp", "mcp", "mdp",
    "default"
];

let newFileMaps = fileMap.filter(string => {
    return regexExtension.exec(string) != null;
});

let int = 0;

exports.pso2ModulesReady = true;

// new Functions here

const queue = [];

exports.getPayload = function(name, ext, exact, fix, callback) {
    queue.push({
        name: name,
        ext: ext,
        exact: exact,
        fix: fix,
        callback: callback
    })
}

let processRequest = async function(name, num, ext, exact, fix, callback) {
    const executor = require('child_process');
    const promisify = require('util.promisify');
    executor.exec = promisify(executor.exec);

    let regex = new RegExp(`^.*\\.*${name}.*\.(${regexExtensions})$`);
    if (exact) {
        regex = new RegExp(`^.*\\.*${name}$`);
    }
    let foundString = newFileMaps.find(string => {
        return regex.exec(string) != null;
    });
    if (foundString != null) {
        let exactFilename = foundString.split('\\')[1];
        let ice = foundString.split('\\')[0];
        try {
            await fs.copyFile(`${pso2win32Path}\\${ice}`, `${destinationFolder}\\${num}\\${ice}`);
        } catch (e) {
            callback(null);
        }
        
        let command = `${destinationFolder}\\ice.exe -o ${destinationFolder}\\${num}\\${ice}_ext ${destinationFolder}\\${num}\\${ice}`;
        let res = null;
        try {
            res = executor.exec(command);
            res = res.stdout;
        } catch (subSubErr) {
            callback("out_of_order");
            return;
        }

        if (res.indexOf('FAILED') > -1) {
            callback("out_of_order");
            return;
        }
        let inputFilePath = `${destinationFolder}\\${num}\\${ice}_ext\\${exactFilename}`;
        let extension = exactFilename.split('.')[exactFilename.split('.').length - 1];
        let outputPath = `${destinationFolder}\\${num}`;
        switch (extension) {
            case "cml": {
                await processConversionCml(inputFilePath, outputPath, ext, fix, uploadFile, callback);
                break;
            }
            default: {
                await uploadFile({
                    cleanupPath: outputPath,
                    newPath: inputFilePath,
                    newExtension: extension
                }, callback)
                break;
            }
        }

    } else {
        callback(null);
    }
}

let uploadFile = async function(subDat, callback) {
    if (subDat.error) {
        callback("out_of_order");
        await cleanup(subDat.cleanupPath);
    } else {
        let exactFilename = subDat.newPath.split('\\')[subDat.newPath.split('\\').length - 1];
        let filename = exactFilename.split('.')[0];
        let data = null;
        try {
            data = await fs.readFile(subDat.newPath);
        } catch (e) {
            callback("out_of_order");
            await cleanup(subDat.cleanupPath);
            return;
        }
    
        callback({
            buffer: data,
            filename: filename,
            extension: subDat.newExtension
        });
        await cleanup(subDat.cleanupPath);
    }
}

let cleanup = async function(cleanupPath, callback) {
    await fs.rmdir(`${cleanupPath}`, {
        maxRetries: 10,
        retryDelay: 500,
        recursive: true
    })
}

let processConversionCml = async function(inputFilePath, outputPath, extension, fix, callback, mainCallback) {
    const executor = require('child_process');
    const promisify = require('util.promisify');
    executor.exec = promisify(executor.exec);

    if (extension == null || extension === '' || allowConversionExtension.indexOf(extension) < 0) {
        callback({
            newPath: `${inputFilePath}`,
            newExtension: `cml`,
            cleanupPath: outputPath
        }, mainCallback)
        return;
    }
    let exactFilename = inputFilePath.split('\\')[inputFilePath.split('\\').length - 1];
    let filename = exactFilename.split('.')[0];
    let command = `\"${destinationFolder}\\SalonTool\\NGS Salon Tool.exe\" -o ${outputPath}\\${filename}.${extension} -ext ${extension} -i ${inputFilePath} ${fix ? '-na': ''} -cli`;

    let res = null;
    try {
        res = await executor.exec(command);
        res = res.stdout;
    } catch (subSubErr) {
        callback({
            error: true
        }, mainCallback);
        return;
    }

    if (res.length > 500) {
        callback({
            error: true
        }, mainCallback);
        return;
    }
    if (extension === 'default' && res.indexOf("Output: " > -1)) {
        let fullPath = res.substring(8, res.length);
        extension = fullPath.split('\\')[fullPath.split('\\').length - 1].split('.')[1];
    }
    callback({
        newPath: `${outputPath}\\${filename}.${extension}`,
        newExtension: `${extension}`,
        cleanupPath: outputPath
    }, mainCallback)
}

let isReady = true;
let mutex = new Mutex();

let interval = setInterval(async () => {
    if (isReady) {
        isReady = false;
        let dat = null;

        await mutex.runExclusive(() => {
            dat = queue.shift();
        });
        
        if (dat == null) {
            isReady = true;
            return;
        }
        let num = int++;
        await cleanup(`${destinationFolder}\\${num}`);
        await fs.mkdir(`${destinationFolder}\\${num}`);
        await processRequest(dat.name, num, dat.ext, dat.exact, dat.fix, dat.callback);
        isReady = true;
    }
}, 500);

exports.endPSO2 = function() {
    clearInterval(interval);
}