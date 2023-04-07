const sleeper = ms => new Promise( res => setTimeout(res, ms));

exports.sleeper = sleeper;