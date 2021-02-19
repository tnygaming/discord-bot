const Enmap = require("enmap");
const TableBoi = require("../modules/TableBoi");

exports.run = async (client, message, args, level) => {
  client.twitch = new Enmap({name: "twitches"});
  const channel = message.channel;

  const subcommand = args[0];

  if(!subcommand) {
    return sendHelp(channel);
  }

  switch(subcommand) {
    case "set":
      const twitch = args[1];

        const key = message.author.id;

        // save twitch
        client.twitch.set(key, {
          userId: key,
          twitch: twitch
        });

        channel.send(`${message.author.username}'s twitch channel has been set to: ${twitch}`);
      }

      break;
    case "get":
      const discordUser = client.parseDiscordUser(args[1]);
      if (discordUser == undefined) {
        // missing/wrong argument, send help
        return sendHelp(channel);
      }

       // retrieve data for user
      const result = client.twitch.get(discordUser.id);

      if(result) {
        channel.send(`${discordUser.username}'s twitch is: ${result.twitch}`);
      } else {
        channel.send("User not found");
      }

      break;
    case "reset":
      reset(client, message, channel, args[1])
      break;
    case "list":
      // retrieve all data
      const twichtz = client.twitch.array();

      // add data rows
      for(const data of twichtz) {
        tableBoi.addRow([client.getDiscordUsername(data.userId), data.twitch]);
      }

      return message.channel.send(`\`\`\`
${tableBoi.getTableString()}
\`\`\``);
    default:
      return sendHelp(channel);
  }
};

function reset(client, message, channel, userId) {
  if(client.permlevel(message) < 3) {
    return channel.send(`You must be Admin or higher to use this command`);
  }

  const discordUser = client.parseDiscordUser(userId);
  if (discordUser == undefined) {
    return sendHelp(channel); // missing/wrong argument, send help
  }

  // retrieve data for user
  client.twitch.delete(discordUser.id)

  const result = client.twitch.get(discordUser.id);
  channel.send(`${discordUser.username}'s twitch has been reset`);
}

function sendHelp(channel) {
  return channel.send(`= USAGE =
.twitch set [twitch]    :: Sets current user's twitch
.twitch get [@user]   :: Returns target user's twitch
.twitch remove [@user] :: Remove user's twitch from list
.twitch list   :: Displays all users twitch channels`,
  {code: "asciidoc"});
}

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "User"
};

exports.help = {
  name: "twitch",
  category: "Gaming",
  description: "Itch your twitch",
  usage: "twitch"
};
