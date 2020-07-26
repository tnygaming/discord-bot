const config = require("../config.js");
const default_choices = ["Yes", "No", "Maybe", "¯\\_(ツ)_/¯"];

exports.run = async (client, message, args, level) => { 
  choices = null
  if (config.is_it_racist_choices == undefined || config.is_it_racist_choices.length == 0) {
    choices = default_choices;
  } else {
    choices = config.is_it_racist_choices;
  }

  const msg = await message.channel.send(choices.random());
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
