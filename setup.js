const inquirer = require("inquirer");
const Enmap = require("enmap");
const fs = require("fs");

let baseConfig = fs.readFileSync("./config_base.txt", "utf8");

const defaultSettings = {
  "prefix": ".",
  "modLogChannel": "mod-log",
  "modRole": "Moderator",
  "adminRole": "Administrator",
  "systemNotice": "true",
  "welcomeChannel": "welcome",
  "welcomeMessage": "Say hello to {{user}}, everyone! We all need a warm welcome sometimes :D",
  "welcomeEnabled": "false"
};

const settings = new Enmap({
  name: "settings",
  cloneLevel: 'deep',
  ensureProps: true
});


let prompts = [
  {
    type: "list",
    name: "resetDefaults",
    message: "Do you want to reset default settings?",
    choices: ["Yes", "No"]
  },
  {
    type: "input",
    name: "token",
    message: "Please enter the bot token from the application page."
  },
  {
    type: "input",
    name: "ownerID",
    message: "Please enter the bot owner's User ID"
  },
];


(async function() {
  console.log("Setting Up GuideBot Configuration...");
  await settings.defer;
  if (!settings.has("default")) {
    // Ask for token/ownerId to first-timers only
    console.log("First Start! Inserting default guild settings in the database...");
    await settings.set("default", defaultSettings);
    const answers = await inquirer.prompt(prompts.slice(1));

    baseConfig = baseConfig
      .replace("{{ownerID}}", answers.ownerID)
      .replace("{{token}}", `"${answers.token}"`);
    fs.writeFileSync("./config.js", baseConfig);
    console.log("REMEMBER TO NEVER SHARE YOUR TOKEN WITH ANYONE!");
    console.log("Configuration has been written, enjoy!");
  } else {
    // Otherwise, ask if they want to reset defaults 
    const answers = await inquirer.prompt(prompts.slice(0, 1));
    if (answers.resetDefaults && answers.resetDefaults === "Yes") {
      console.log("Resetting default guild settings...");
      await settings.set("default", defaultSettings);
    }
  }

  await settings.close();
}());
