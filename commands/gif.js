const { giphy_api_key } = require("../config.js");
const giphy = require("giphy-api")(giphy_api_key);

exports.run = async (client, message, args, level) => {
  const start = Date.now();
  const query = args.join(" ");
  giphy.search({
    "q": query,
    "rating": "pg-13"
  }).then(function(rest) {
      console.log(`Fetch took ${Date.now() - start}ms`);
      const results = rest.data
      if (results.length > 0) {
        gif = results.random();
        message.reply(`${gif.embed_url}`);
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
  usage: "gif [query]"
};
