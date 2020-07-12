
const finnhub = require('finnhub');
const config = require("../config.js");

const api_key = finnhub.ApiClient.instance.authentications['api_key'];
api_key.apiKey = config.finnhub_api_key; 
const finnhubClient = new finnhub.DefaultApi();

exports.run = async (client, message, args, level) => {
  if(args[0]) {
    const company = args[0].toUpperCase();
    finnhubClient.quote(company, (error, data, response) => {
      console.log(company);
      console.log(data);
      if(Object.keys(data).length === 0) {
        message.reply("Invalid ticker ["+company+"]");
      } else {
        message.channel.send(`\`\`\`\n
Company: ${company}

Today's Open: ${data.o}
Today's High: ${data.h}
Today's Low: ${data.l}
Current Price: ${data.c}
Yesterday's Close: ${data.pc}\`\`\``);
      }
    });
      
  } else {
    message.reply(".stonks [ticker]")
  }

};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "User"
};

exports.help = {
  name: "stonks",
  category: "Miscelaneous",
  description: "Stonks only go up",
  usage: "stonks [ticker]"
};
