const config = require("../config.js");
const giphy = require("giphy-api")(config.giphy_api_key);

exports.run = async (client, message, args, level) => {
  const start = Date.now();
  const tags = args.join(" ");
  giphy.random({
    "tag": tags,
    "rating": "pg-13"
  }).then(function(rest) {
      console.log(`Fetch took ${Date.now() - start}ms`);
      if(Object.keys(rest.data).length && rest.data.embed_url) {
        message.reply(`${rest.data.embed_url}`);
      } else {
        message.reply("I'm sorry for your loss");
      }
  });
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ["giphy"],
  permLevel: "User"
};

exports.help = {
  name: "gif",
  category: "Miscelaneous",
  description: "Display a random gif",
  usage: "gif [tags]"
};
