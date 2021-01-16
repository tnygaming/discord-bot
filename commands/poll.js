const { prototype } = require("../modules/DiscordClientAwareScheduler");
const Poll = require("../modules/Poll");
const argParser = require('../modules/ArgParser')

exports.run = async (client, message, args, level) => {
  const channel = message.channel
  const author = message.author

  const subcommand = args[0]
  if(!subcommand) {
    return sendHelp(channel)
  }

  switch(subcommand) {
    case 'create':
      const pollInput = argParser.parseArgs(args.slice(1));
      if (pollInput.length <= 2) {
        return sendHelp(channel);
      } 
      await startPoll(client, message, pollInput);
      break
    default:
      return sendHelp(channel)
  }
};

async function startPoll(client, message, pollInput) {
  const poll = await new Poll(message, pollInput[0], pollInput.slice(1));
  await poll.start(message.channel);
}

function sendHelp(channel) {
  return channel.send(`= USAGE =
.poll create "question" "option 1" "option 2" "option n":: Creates a poll with up to 10 options`,
  {code: 'asciidoc'});
}

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: 'User'
};

exports.help = {
  name: 'poll',
  category: 'Miscellaneous',
  description: 'Allows you to create polls',
  usage: 'poll'
};