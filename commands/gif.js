const { giphy_api_key } = require("../config.js");
const giphy = require("giphy-api")(giphy_api_key);
/* 
 * Giphy API Explorer: https://developers.giphy.com/explorer
 * Giphy API Rest API docs: https://developers.giphy.com/docs/api/endpoint/
 * JS module for Giphy API: https://www.npmjs.com/package/giphy-api
 */

exports.run = async (client, message, args, level) => {
  const start = Date.now();
  const query = args.join(" ");
  giphy.search({
    "q": query,
    "limit": 50,
    "rating": "pg-13"
  }).then(function(rest) {
    console.log(`Fetch took ${Date.now() - start}ms`);
    const results = rest.data

    // We want to usually give a relevant result, but every so often, we want the result to be a little more random
    const randomNumber = Math.random();
    console.log(`Number of gifs in results: ${rest.data.length}, randomNumber: ${randomNumber}`);
    buckets = [results.slice(0, 15), results.slice(15, 40), results.slice(40)];
    chosenBucket = null;
    if (randomNumber < 0.85) {
      chosenBucket = buckets[0];
    } else if (randomNumber < 0.92) {
      chosenBucket = buckets[1];
    } else {
      chosenBucket = buckets[2];
    }

    // There might not have been 100 gifs in the results, so some buckets may be empty
    // If so, just use the first bucket
    if (chosenBucket.length == 0) {
      chosenBucket = buckets[0];
    }

    if (chosenBucket.length > 0) {
      gif = chosenBucket.random();
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
