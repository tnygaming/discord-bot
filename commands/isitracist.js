const config = require("../config.js");
const defaultChoices = ["Yes", "No", "Maybe", "¯\\_(ツ)_/¯"];

exports.run = async (client, message, args, level) => {
  let choices = null
  if (config.is_it_racist_choices == undefined || config.is_it_racist_choices.length == 0) {
    choices = defaultChoices;
  } else {
    choices = config.is_it_racist_choices;
  }

  await message.channel.send(choices.random());
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "User"
};

exports.help = {
  name: "isitracist",
  category: "Miscellaneous",
  description: "Is it racist?",
  usage: "isitracist"
};
