const Discord = require('discord.js');
const Enmap = require("enmap");

const ALLOWED_RANKS = [
  "Iron1",
  "Iron2",
  "Iron3",
  "Bronze1",
  "Bronze2",
  "Bronze3",
  "Silver1",
  "Silver2",
  "Silver3",
  "Gold1",
  "Gold2",
  "Gold3",
  "Platinum1",
  "Platinum2",
  "Platinum3",
  "Diamond1",
  "Diamond2",
  "Diamond3",
  "Immortal1",
  "Immortal2",
  "Immortal3",
  "Radiant"
];

exports.run = async (client, message, args, level) => {
  client.ranks = new Enmap({name: "ranks"});
  const channel = message.channel;


  if(args.length == 0) {
    return sendHelp(channel);
  }

  switch(args[0]) {
    case "set":
      const rank = args[1];

      if(!rank || !ALLOWED_RANKS.includes(rank)) {
        // invalid rank, send allowed ranks
        return sendRanks(channel);
      } else {
        const key = message.author.id;
        const username = message.author.username;

        // save rank
        client.ranks.set(key, {
          username: username,
          rank: rank
        });

        channel.send(username + "'s rank set to: " + rank);
      }

      break;
    case "get":
      const userArg = args[1];

      if(!userArg || !userArg.startsWith("<@")) {
        // missing/wrong argument, send help
        return sendHelp(channel);
      }

      // extract userId
      const userId = userArg.replace(/[<@!>]/g, '');

       // retrieve data for user
      const result = client.ranks.get(userId);

      if(result) {
        channel.send(result.username + " is: " + result.rank);
      } else {
        channel.send("User not found");
      }

      break;
    case "leaderboard":
      // retrieve all data
      const ranks = client.ranks.array();

      // sort
      const sortedRanks  = ranks.sort((a, b) => getRankIndex(b.rank) - getRankIndex(a.rank));

      // display as embed.  todo: use ascii table instead
      const embed = new Discord.MessageEmbed()
        .setTitle("Leaderboard")
        .setColor("#0099ff");

      // add data rows
      for(const data of sortedRanks) {
        embed.addField(data.username, data.rank);
      }

      return message.channel.send(embed);
    default:
      return sendHelp(channel);
  }
};

function sendHelp(channel) {
  return channel.send(`= USAGE =
.rank set [rank]  :: Sets current user's rank
.rank get [@user] :: Returns target user's rank
.rank leaderboard :: Returns leaderboard of all users and their ranks`,
  {code: "asciidoc"});
}

function sendRanks(channel) {
  return channel.send("Invalid rank, available ranks:\n" + " • " + ALLOWED_RANKS.join("\n • "), {code: "asciidoc"});
}

function getRankIndex(rank) {
  return ALLOWED_RANKS.indexOf(rank); // todo: use Map instead of List for storing ranks to make this O(1)
}

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "User"
};

exports.help = {
  name: "rank",
  category: "Gaming",
  description: "???",
  usage: "rank"
};
