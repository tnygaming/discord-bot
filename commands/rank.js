const Enmap = require("enmap");
const TableBoi = require("../modules/TableBoi");

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
].reverse();

exports.run = async (client, message, args, level) => {
  client.ranks = new Enmap({name: "ranks"});
  const channel = message.channel;

  const subcommand = args[0];

  if(!subcommand) {
    return sendHelp(channel);
  }

  switch(subcommand) {
    case "set":
      const rank = args[1];

      if(!rank || !ALLOWED_RANKS.includes(rank)) {
        // invalid rank, send allowed ranks
        return sendRanks(channel);
      } else {
        const key = message.author.id;

        // save rank
        client.ranks.set(key, {
          userId: key,
          rank: rank
        });

        channel.send(message.author.username + "'s rank set to: " + rank);
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

        channel.send(getUsername(client, userId) + " is: " + result.rank);
      } else {
        channel.send("User not found");
      }

      break;
    case "leaderboard":
      // retrieve all data
      const ranks = client.ranks.array();

      // sort
      const sortedRanks  = ranks.sort((a, b) => getRankIndex(b.rank) - getRankIndex(a.rank));

      const tableBoi = new TableBoi(["User", "Rank"]);

      // add data rows
      for(const data of sortedRanks) {
        tableBoi.addRow([getUsername(client, data.userId), data.rank]);
      }

      return message.channel.send(`\`\`\`
${tableBoi.getTableString()}
\`\`\``);
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

function getUsername(client, userId) {
  const userObj = client.users.cache.get(userId);
  if(userObj) {
    return userObj.username;
  }

  return "";
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
  description: "Flex your rank",
  usage: "rank"
};
