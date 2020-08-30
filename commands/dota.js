const enmap = require('enmap')
const bent = require('bent')

const dotaClient = require('../modules/OpenDotaClient')
const timeFormatters = require('../modules/TimeFormatters')

//nested getter for objects
const get = (p, o) =>
  p.reduce((xs, x) =>
    (xs && xs[x]) ? xs[x] : null, o)

exports.run = async (client, message, args, level) => {
  client.dotaConf = new enmap({name: 'dotaConf'})
  const channel = message.channel
  const author = message.author

  const subcommand = args[0]

  if(!subcommand) {
    return sendHelp(channel)
  }

  switch(subcommand) {
    case 'register':
      const dotaId = args[1]
      await registerLink(client, channel, author, dotaId)
      break
    case 'getLatestMatch':
      await getLatestMatch(client, channel, author)
      break
    default:
      return sendHelp(channel)
  }
};

async function getLatestMatch(client, channel, discordUser) {
  const dotaIds = client.dotaConf
  .filter(
    entry => 
      entry.channelId === channel.id && 
      entry.discordId === discordUser.id)
  .map(entry => entry.dotaIds)
  .filter(entry => !!entry)
  .flat()
  
  if (!dotaIds.length) {
    channel.send(`${discordUser.username} is not associated with a dota account`)
    return
  }

  latestMatch = await dotaClient.getLatestMatch(dotaIds[0])

  if (!!!latestMatch) {
    channel.send(`${discordUser.username} associated with dota accounts ${dotaIds} has not played a match recently`)
  }
  else {
    const embedMsg = new discord.MessageEmbed()
      .setColor('#0099ff')
      .setTitle(`Match ${latestMatch.match_id}`)
      .setDescription(`${discordUser.username} recently played in a ${timeFormatters.formatSeconds(latestMatch.duration)} long match. 
More info at [opendota](https://www.opendota.com/matches/${latestMatch.match_id}) [dotabuff](https://www.dotabuff.com/matches/${latestMatch.match_id})`)
    channel.send(embedMsg)
  }
}

async function registerLink(client, channel, discordUser, dotaId) {
  const dotaInfo = await dotaClient.getPlayer(dotaId)
  if (!validateId(dotaInfo)) {
    channel.send(`could not find dota account for ${dotaId}`)
  }
  const dotaConfKey = getConfKey(channel.id, discordUser.id)
  const dotaConf = client.dotaConf.ensure(dotaConfKey, {
    dotaIds: [],
    discordId: discordUser.id, 
    channelId: channel.id
  })
  if (dotaConf.dotaIds.includes(dotaId)){
    channel.send(`${discordUser.username} is already linked to account ${dotaInfo.profile.personaname}`)
  }
  else { 
    client.dotaConf.push(dotaConfKey, dotaId, "dotaIds", false)
    channel.send(`${discordUser.username} was linked to account ${dotaInfo.profile.personaname}`)
  }
}

/**
 * Generates the dotaConf composite key from channelId, discordId, and dotaID
 */
function getConfKey(channelId, discordId) {
  return (`${channelId}-${discordId}`)
}

function validateId(dotaInfo) {
  return !!get(['profile', 'account_id'], dotaInfo)
}

function sendHelp(channel) {
  return channel.send(`= USAGE =
.dota register [dota account id]  :: Links your discordId to the specified dota account id for the current channel. Account id can be found in your dotabuff profile url (https://www.dotabuff.com/players/<ACCOUNT_ID>)
.dota getLatestMatch :: gets the latest match for your linked dota account(s).`,
  {code: 'asciidoc'});
}

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: 'User'
};

exports.help = {
  name: 'dota',
  category: 'Gaming',
  description: 'Stats app for dota',
  usage: 'dota'
};
