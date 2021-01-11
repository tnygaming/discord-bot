exports.run = async (client, message, args, level) => { 
    const msg = await message.channel.send("Welcome");
    msg.edit(`Welcome!`);
  };
  
  exports.conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: "User"
  };
  
  exports.help = {
    name: "firstMessage",
    category: "Miscellaneous",
    description: "Sending and editing the first message.",
    usage: "firstMessage"
  };
  