const bent = require('bent')
const Bottleneck = require('bottleneck')
const dotaClient = bent('https://api.opendota.com/api/', 'json', 200)

// rate limited according to open dota specs (60/min)
const limiter = new Bottleneck({
  reservoir: 60,
  reservoirRefreshAmount: 60,
  reservoirRefreshInterval: 60 * 1000
})

async function getLatestMatch(dotaId) {
  if (dotaId == undefined) {
    return undefined
  }
  let latestStartTime = 0
  let latestMatch
  let matchInfos = await limiter.schedule(() => dotaClient(`players/${dotaId}/recentMatches`))
  for (const matchInfo of matchInfos) {
    if (matchInfo.start_time > latestStartTime) {
      latestStartTime = matchInfo.start_time
      latestMatch = matchInfo
    }
  }
  return latestMatch
}

async function getMatch(matchId) {
  if (matchId == undefined) {
    return undefined
  }
  return await limiter.schedule(() => dotaClient(`matches/${matchId}`))
}

async function getPlayer(dotaId) {
  if (dotaId == undefined) {
    return undefined
  }
  return await limiter.schedule(() => dotaClient(`players/${dotaId}`))
}

module.exports.getLatestMatch = getLatestMatch
module.exports.getMatch = getMatch
module.exports.getPlayer = getPlayer
