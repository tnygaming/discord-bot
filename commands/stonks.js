
const finnhub = require('finnhub');
const config = require("../config.js");

const api_key = finnhub.ApiClient.instance.authentications['api_key'];
api_key.apiKey = config.finnhub_api_key; 
const finnhubClient = new finnhub.DefaultApi();

exports.run = async (client, message, args, level) => {
  console.log(args);
  const company = args[0];
  console.log(company);

  if(company) {
    finnhubClient.quote("VEEV", (error, data, response) => {
      console.log(data);
      message.channel.send(`\`\`\`\n
Today's Open: ${data.o}
Today's High: ${data.h}
Today's Low: ${data.l}
Current Price: ${data.c}
Yesterday's Close: ${data.pc}\`\`\``);
    });
  }

};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "Users"
};

exports.help = {
  name: "stonks",
  category: "Miscelaneous",
  description: "Stonks only go up",
  usage: "stonks <ticker>"
};
