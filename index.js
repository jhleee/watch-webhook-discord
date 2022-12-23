const readLastLines = require('read-last-lines');
const fs = require("fs");
const hound = require("hound");
const path = require("path");
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const _ = require('lodash');

if (!fs.existsSync("./setting.json")) {
    console.error("setting.json not found.");
    process.exit(1);
}

const config = require("./setting.json");
const webhook = new Webhook(config.url);

const logger = {
    log: (...args) => {
        console.log(`[${new Date().toLocaleString()}]`, ...args);
    },
    error: (...args) => {
        console.error(`[${new Date().toLocaleString()}]`, ...args);
    }
};

const callback = _.debounce((filepath, event) => {
    let filename = path.basename(filepath);
    let msg = new MessageBuilder()
        .setTimestamp()
        .setFooter(filepath)
        .setColor(parseInt("0xab2323"))
        .setTitle(`File Watcher: ${filename}`);

    readLastLines.read(filepath, 15).then((lines) => {
        logger.log(`[${event}] ${filepath}\n${lines}`);
        lines = lines.replaceAll("`", "\\`");
        msg.setDescription("```\n" + lines + "\n```");


        webhook.send(msg);
    });
}, 1000);

for (let filename of config.path) {
    let fullPath = path.resolve(filename);
    if (!fs.existsSync(filename)) {
        logger.error(`${filename} does not exist`);
    } else {
        logger.log(`[watch] ${filename}`, fullPath);
        let watcher = hound.watch(fullPath);
        watcher.on('change', (fileapth) => callback(fileapth, "changed"));
    }
}
