# Usagi
Library for UsagiBot  
Only use this repo as submodule  
This repo is not executable, go to the 2 repo below.

## Repositories that uses this as submodule are
[Usagi Bot without GUI](https://github.com/Xuljian/UsagiBotGuiless)  
[Usagi Bot](https://github.com/Xuljian/UsagiBot)

## Explanation
<h3>usagi-constants.js</h3>
This is where the config for API token and other stuff goes, the first few lines is needed to be filled especially the BOT_TOKEN. The default prefix for this bot is "#!"<br/>
<h3>event-types</h3>
This folder consists of js files that are tied to the events that discord gateway will fire, the name of the files are used to match against the events that is sent from discord. I only used some of the events, you can add more based on the events in the discord API<br/>
<h3>commands</h3>
This folder consists of js files that are used to process commands. This commands are text commands (Not to be confused with slash commands).<br/>
<h3>interactions</h3>
This folder consists of js files that are used to process slash commands.<br/>
<h3><i>Anything under PSO2 folder</i></h3>
This is my personal stuff, the PSO2 process relies on an external program not included in here, so it is worth while to remove this if you are not me.<br/>