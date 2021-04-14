const rezClient = require('../modules/CampingReservationClient')

exports.run = async (client, message, args, level) => {
  const channel = message.channel
  const author = message.author

  const subcommand = args[0]
  if (!subcommand) {
    return sendHelp(channel)
  }

  const month = _getMonth(args[1])

  switch (subcommand) {
    case 'check':
      return await check(channel, month)
    case 'watch':
      return await watch(client, channel, author, month)
    case 'unwatch':
      return await unwatch(client, channel, author, month)
    case 'watchlist':
      return await watchlist(client, channel, author)
    default:
      return sendHelp(channel)
  }
}

async function check(channel, month) {
  const reservations = await rezClient.getReservations(month)
  if (reservations.size) {
    channel.send(rezClient.getEmbed(reservations, month))
  }
}

async function watch(client, channel, discordUser, month) {
  const key = discordUser.id;
  const userData = _getUserData(client, key)

  if (!userData.monthsToCheck.includes(month)) {
    client.rezData.push(key, month, "monthsToCheck", false)
  }

  _sendWatchList(client, channel, key)
  check(channel, month)
}

async function unwatch(client, channel, discordUser, month) {
  const key = discordUser.id;
  const userData = _getUserData(client, key)

  if (userData.monthsToCheck.includes(month)) {
    client.rezData.remove(key, month, 'monthsToCheck')
  }

  _sendWatchList(client, channel, key)
}

async function watchlist(client, channel, discordUser) {
  _sendWatchList(client, channel, discordUser.id)
}

function _getUserData(client, userId) {
  return client.rezData.ensure(userId, {
    monthsToCheck: [],
    userId
  })
}

function _getMonth(month) {
  if (!month || !(month >= 1 && month <= 12)) {
    month = new Date().getMonth() + 1 // get current month, + 1 since it JS months are 0-indexed
  }

  return month
}

function _sendWatchList(client, channel, userId) {
  channel.send(`Currently watching: ${_getUserData(client, userId).monthsToCheck}`)
}

function sendHelp(channel) {
  return channel.send(
`= USAGE =
.rez check [month]   :: Displays the available reservations for the month
.rez watch [month]   :: Start watching the given month for new reservations, you will get a DM when there are new reservations.
.rez unwatch [month] :: Stop watching the given month
.rez watchlist       :: Returns the months currently being watched`,
  {code: 'asciidoc'}
);
}

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "User"
};

exports.help = {
  name: "rez",
  category: "Miscellaneous",
  description: "Gets current availability for campsite",
  usage: "rez"
};
