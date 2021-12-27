// ~/app.js, node entry point for mpserver.
var fs, path, express;
var tables = {}, modules = {}, server = null, logging = true;
const tablePath = "./tables/", modulePath = "./modules/", appHeader =
`=================================================================================================
- SERVER DASHBOARD - SERVER DASHBOARD - SERVER DASHBOARD - SERVER DASHBOARD - SERVER DASHBOARD -
███╗   ███╗██╗██████╗ ███╗   ██╗██╗ ██████╗ ██╗  ██╗████████╗     ██████╗  █████╗ ███████╗███████╗
████╗ ████║██║██╔══██╗████╗  ██║██║██╔════╝ ██║  ██║╚══██╔══╝     ██╔══██╗██╔══██╗██╔════╝██╔════╝
██╔████╔██║██║██║  ██║██╔██╗ ██║██║██║  ███╗███████║   ██║        ██████╔╝███████║███████╗███████╗
██║╚██╔╝██║██║██║  ██║██║╚██╗██║██║██║   ██║██╔══██║   ██║        ██╔═══╝ ██╔══██║╚════██║╚════██║
██║ ╚═╝ ██║██║██████╔╝██║ ╚████║██║╚██████╔╝██║  ██║   ██║        ██║     ██║  ██║███████║███████║
╚═╝     ╚═╝╚═╝╚═════╝ ╚═╝  ╚═══╝╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝        ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝
- SERVER DASHBOARD - SERVER DASHBOARD - SERVER DASHBOARD - SERVER DASHBOARD - SERVER DASHBOARD -
==================================================================================================`

// TODO: Verify if router remount breaks the server._router.stack stack... Fix by referencing the layer by name somehow to remove it?... 
// TODO: Fix issue with stdin.on('data') being a thread block for output (ie, the log) by waiting for input. Fix by making something async...

// Event Handlers
function OnInit() {
    try {
        process.title = "MPServer";
        var config = require('./app.config');
        Object.keys(config).forEach(configKey => global[configKey] = config[configKey]);

        fs = require('fs');
        path = require('path');
        express = require('express');

        HandleOnLogClear();
        HandleOnMount();
    }
    catch (ex) { HandleOnMessageLog("MAJOR error occured!\n [" + ex + "]", "[ERROR]"); }
}

function HandleOnMount() {
    if (server != null)
        server.close();
    server = express();
    server.use(express.json());

    if (!fs.existsSync(tablePath)) fs.mkdirSync(tablePath);
    fs.readdirSync(tablePath)
        .forEach(filePath => tables[path.basename(filePath.toLowerCase(), ".json")] = tablePath + filePath);
    if (!fs.existsSync(modulePath)) fs.mkdirSync(modulePath);
    fs.readdirSync(modulePath)
        .forEach(filePath => modules[path.basename(filePath.toLowerCase(), ".js")]
            = server.use(require(modulePath + filePath)(tables)));

    server = server.listen(global["port"]);
}

function HandleOnInput(input) {
    input = input.toString().trim();
    var action = function () { HandleOnMessageLog("No matching command was found. Type 'help' to get a break down of valid commands."); }
    Object.keys(commands).forEach(cmd => action = cmd.split(':')[0] != input ? action : commands[cmd]);
    action();
}

function HandleOnLogClear() {
    console.log(appHeader);
    fs.writeFileSync("./app.dmp", appHeader);
    HandleOnMessageLog("For help, type 'help' and hit enter.")
}

async function HandleOnMessageLog(message, tag = ">") {
    if (logging) {
        var formattedTag = tag;
        switch (tag.toUpperCase()) {
            case "[WARNING]": formattedTag = '\x1b[43m' + formattedTag + '\x1b[0m'; break;
            case "[ERROR]": formattedTag = '\x1b[41m' + formattedTag + '\x1b[0m'; break;
            case "[NOTE]": formattedTag = '\x1b[42m' + formattedTag + '\x1b[0m'; break;
        }

        fs.appendFileSync("./app.dmp", "\n" + tag + " " + message);
        console.log(formattedTag + " " + message);
    }                                                                                                                                               
}

// Event Subscriptions
process.on('SIGINT', () => HandleOnInput("quit"));
process.stdin.on('data', input => HandleOnInput(input));

// Commands
const commands = {
    // add more here later...
    "logmode: Toggle whether or not the log is active.": function () {
        var old = logging;
        logging = true;
        HandleOnMessageLog(old ? "Sneaky log mode active." : "Verbose log mode active.");
        logging = !old;
    },
    "clear: Clears the log.": function () {
        console.clear();
        HandleOnLogClear();
    },
    "remount: Remounts all all tables and modules found (useful for module hotswapping).": function () {
        HandleOnMount();
        var helpStr = { table: tables, module: modules };
        Object.keys(helpStr).forEach(key => {
            var str = "The following " + key + "s were mounted: ";
            Object.keys(helpStr[key]).forEach(name => str += name + ", ");
            HandleOnMessageLog(str.substring(0, str.length - 2));
        });
    },
    "help: Prints a list of all valid commands.": function () {
        var helpStr = "Here is a list of all valid commands:\n";
        Object.keys(commands).forEach(cmd => helpStr += "\t-" + cmd + '\n');
        HandleOnMessageLog(helpStr);
    },
    "quit: Shuts down the server and quit the dashboard.": function () {
        HandleOnMessageLog("Shutting down and quitting dashboard.")
        process.exit();
    }
};

module.exports = { log: HandleOnMessageLog };
OnInit(); // Finally, initialize and export.