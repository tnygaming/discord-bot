const enmap = require('enmap')
const discord = require('discord.js')
const dotaClient = require('../modules/OpenDotaClient')
const _ = require('underscore')
const timeFormatters = require('../modules/TimeFormatters')

const dotaConf = new enmap({name: 'dotaConf'})

/**
 * Announces recent dota matches in discord. Performs deduplication of matches by discord channel. 
 * Usage: offer all the matches that should be considered for announcement then trigger the announce command.
 * If multiple discord members play in the same match, the match will be announced once.
 * If a match that has already been announced is offered, it will be ignored.
 */
class RecentDotaMatchAnnouncer {
  constructor() {
    this.candidateMatches = new Map()
    this.recentlyAnnouncedMatches = new Map()
  }

  async offer(match) {
    if (match == null) {
      return
    }

    const currentTime = new Date().getSeconds()
    if (currentTime - match.start_time < 3600) {
      if (!this.candidateMatches.has(match.match_id) && !this.recentlyAnnouncedMatches.has(match.match_id)) {
        const detailedMatch = await dotaClient.getMatch(match.match_id)
        this.candidateMatches.set(match.match_id, detailedMatch)
      }
    }
  }

  // for each channel, for each match, find all the discord users in the channel who played in it and announce the match in the channel.
  announce(client) {
    if (!this.candidateMatches.size) {
      return
    }
    const confs = this._getFlattenedDotaConfs()
    
    const confsByChannel = _.groupBy(confs, config => config.channelId)
  
    for (let [channelId, configs] of Object.entries(confsByChannel)) {
      for (let [, match] of this.candidateMatches) {
        const importantPlayers = match.players
        .map(player => {
          const matchingConf = configs.find(config => config.dotaId == player.account_id)
          if (!matchingConf) {
             return null
          }
          return {
            dotaId: player.account_id,
            dotaName: player.personaname,
            discordId: matchingConf.discordId,
            discordName: client.getDiscordUsername(matchingConf.discordId),
            team: player.isRadiant ? 'Radiant' : 'Dire'
          }
        })
        .filter(player => player != null)
        if (importantPlayers.length) {
          this._announceMatch(client, channelId, importantPlayers, match)
        }
      }
    }
    // fucking js map iterator decided to be in reverse.
    this.candidateMatches.forEach((v, k) => this.recentlyAnnouncedMatches.set(k, v))
    this.candidateMatches.clear()
  }

  _announceMatch(client, channelId, importantPlayers, match) {
    const channel = client.channels.resolve(channelId.toString())
    
    let radiantPlayers = []
    let direPlayers = []
    for (const player of match.players) {
      let importantPlayer = importantPlayers.find(p => player.account_id != undefined && p.dotaId == player.account_id)
      
      let playerName = `${player.personaname} ${importantPlayer == null ? '' : `(${importantPlayer.discordName})`}`
      if (player.isRadiant) {
        radiantPlayers.push(playerName)
      } else {
        direPlayers.push(playerName)
      }
    }

    const winningTeamName = match.radiant_win ? "Radiant" : "Dire"
    const embedMsg = new discord.MessageEmbed()
      .setColor('#0099ff')
      .setTitle(`Match ${match.match_id}`)
      .setDescription(`Members of this channel recently played in a ${timeFormatters.formatSeconds(match.duration)} long ${winningTeamName} victory. 
More info at [opendota](https://www.opendota.com/matches/${match.match_id}) [dotabuff](https://www.dotabuff.com/matches/${match.match_id})`)
      .addFields(
        {
          name: 'Radiant Players',
          value: `${radiantPlayers.length ? radiantPlayers.join('\n') : 'N/A'}`
        },
        {
          name: 'Dire Players',
          value: `${direPlayers.length ? direPlayers.join('\n') : 'N/A'}`
        }
      )
    channel.send(embedMsg)
  }

  _getFlattenedDotaConfs() {
    return dotaConf.filterArray(entry => !!entry)
    .flatMap(entry => {
      let result = []
      for (const dotaId of entry.dotaIds) {
        if (dotaId !== undefined) {
          result.push({
            dotaId,
            discordId: entry.discordId,
            channelId: entry.channelId
          })
        }
      }
      return result
    })
  }
}


let MatchAnnouncer = new RecentDotaMatchAnnouncer()
module.exports.run = async client => {
  const dotaIds = dotaConf
  .filter(entry => !!entry)
  .map(entry =>  entry.dotaIds)
  .flat()
  
  for (const dotaId of dotaIds) {
    const latestMatch = await dotaClient.getLatestMatch(dotaId)
    await MatchAnnouncer.offer(latestMatch)
  }
  MatchAnnouncer.announce(client)
}

module.exports.conf = {
  cron: '*/20 * * * *'
}
