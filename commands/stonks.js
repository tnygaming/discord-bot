
const finnhub = require('finnhub');
const config = require("../config.js");

const api_key = finnhub.ApiClient.instance.authentications['api_key'];
api_key.apiKey = config.finnhub_api_key; 
const finnhubClient = new finnhub.DefaultApi();
const numLocaleOpts = {minimumFractionDigits: 2, maximumFractionDigits: 2};


exports.run = async (client, message, args, level) => {
  const start = Date.now();

  if(args[0]) {
    const company = args[0].toUpperCase();
    finnhubClient.quote(company, (error, data, response) => {
      console.log(`Fetch took ${Date.now() - start}ms`);
      console.log(company);
      console.log(data);
      if(Object.keys(data).length === 0) {
        message.reply(`Invalid ticker [${company}]`);
      } else {
        const percentDiff = Math.abs(data.c - data.pc) / data.pc * 100;
        const priceDiff = Math.abs(data.c - data.pc);

        let arrowDirection = '\u25B2'; //up
        let changePrefix = '\+';
        if(data.c < data.pc) {
          arrowDirection = '\u25BC'; //down 
          changePrefix = '\-';
        } 

        const formattedPriceDiff = priceDiff.toLocaleString('en-US', numLocaleOpts);
        const formattedPercentDiff = percentDiff.toLocaleString('en-US', numLocaleOpts);

        // important to have price prefix match with diff markdown colors
        // + in the beginning of the line for green
        // - for red
        message.channel.send(`\`\`\`diff
Company: ${company}
${changePrefix}\$${formattedPriceDiff} (${changePrefix}${formattedPercentDiff}%) ${arrowDirection}

Today's Open: ${data.o}
Today's High: ${data.h}
Today's Low: ${data.l}
Current Price: ${data.c} 
Yesterday's Close: ${data.pc}
\`\`\``);
      }
    });
      
  } else {
    message.reply(` \`Usage: ${message} [ticker]\``)
  }

};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ["stonk", "quote"],
  permLevel: "User"
};

exports.help = {
  name: "stonks",
  category: "Miscelaneous",
  description: "Stonks only go up",
  usage: "stonks [ticker]"
};
