const enmap = require('enmap')
const discord = require('discord.js')
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
  let dotaId = undefined
  let discordUser = undefined
  if(!subcommand) {
    return sendHelp(channel)
  }

  switch(subcommand) {
    case 'register':
      dotaId = args[1]
      await registerLink(client, channel, author, dotaId)
      break
    case 'deregister': 
      dotaId = args[1]
      await deregisterLink(client, channel, author, dotaId) 
      break
    case 'whois': 
      discordUser = client.parseDiscordUser(args[1])
      if (discordUser == undefined) {
        channel.send(`could not find the discordUser for ${args[1]}`)
      }
      await getDotaAccounts(client, channel, discordUser)
      break
    case 'getLatestMatch':
      await getLatestMatch(client, channel, author)
      break
    default:
      return sendHelp(channel)
  }
};

async function getDotaAccounts(client, channel, discordUser) {
  const dotaConf = client.dotaConf.get(getConfKey(channel.id, discordUser.id))
  let playerLinks = []
  for (dotaId of dotaConf.dotaIds) {
    const dotaAccount = await dotaClient.getPlayer(dotaId)
    playerLinks.push(buildPlayerLink(dotaAccount.profile))
  }
  const embedMsg = new discord.MessageEmbed()
      .setColor('#0099ff')
      .setTitle(`${discordUser.username} dota accounts`)
      .setDescription(`${discordUser.username} is associated with ${playerLinks}`)
    channel.send(embedMsg)
}

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

async function deregisterLink(client, channel, discordUser, dotaId) {
  const dotaConfKey = getConfKey(channel.id, discordUser.id)
  const dotaConf = client.dotaConf.ensure(dotaConfKey, {
    dotaIds: [],
    discordId: discordUser.id, 
    channelId: channel.id
  })
  if (dotaConf.dotaIds.includes(dotaId)) {
    client.dotaConf.remove(dotaConfKey, dotaId, 'dotaIds')
    channel.send(`${discordUser.username} was unlinked from account ${dotaId}`)
  }
  else {
    channel.send(`${discordUser.username} is not linked to ${dotaId}`)
  }
}

function buildPlayerLink(player) {
  return (`[${player.personaname} (${player.account_id})](https://www.opendota.com/players/${player.account_id})`)
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
.dota register [dota account id]  :: Links your discordId to the specified dota account id for the current channel. Account id can be found in your opendota profile url (https://www.opendota.com/players/<ACCOUNT_ID>)
.dota deregister [dota account id] :: Unlinks your discordId to the specified dota account id for the current channel. 
.dota whois [@discordUser] :: Provides opendota links for dota accounts the discord user is linked to. 
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
