exports.run = async (client, message, args, level) => { 
    const msg = await message.channel.send("paca");
    msg.edit(`paca DEEZ NUTS!`);
};

// module.exports = (client) => {

// }
  
exports.conf = {
enabled: true,
guildOnly: false,
aliases: [],
permLevel: "User"
};

exports.help = {
name: "paca",
category: "Miscellaneous",
description: "for reacting to roles.",
usage: "role"
};
