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
      let useNumberEmojis = false;
      args = args.slice(1);
      if (args[0] === "-n") {
        useNumberEmojis = true;
        args = args.slice(1);
      }
      const pollInput = argParser.parseArgs(args);
      if (pollInput.length <= 2) {
        return sendHelp(channel);
      } 
      await startPoll(client, message, pollInput, useNumberEmojis);
      break
    default:
      return sendHelp(channel)
  }
};

async function startPoll(client, message, pollInput, useNumberEmojis) {
  const poll = await new Poll(message, pollInput[0], pollInput.slice(1), useNumberEmojis);
  await poll.start(message.channel);
}

function sendHelp(channel) {
  return channel.send(`= USAGE =
.poll create "question" "option 1" "option 2" "option n":: Creates a poll with up to 10 options, 
.poll create -n "question" "option 1" "option 2" "option n":: Creates a poll with up to 10 options using the number emotes instead of channel emotes`,
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