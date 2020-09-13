const enmap = require('enmap')
const discord = require('discord.js')
const rezClient = require('../modules/CampingReservationClient')
var _ = require('underscore')
const { conf } = require('../commands/dota')
const TableBoi = require("../modules/TableBoi");

// reservations from previous run, used to figure out the new reservations
const previousReservations = new Map()

function getNewReservations(month, reservations) {
  const previousReservationsForMonth = previousReservations.get(month)
  previousReservations.set(month, reservations)

  if(!previousReservationsForMonth) {
    return reservations // first run
  }

  // remove the sites where the dates haven't changed
  const newReservations = new Map(reservations)
  newReservations.forEach((currentDates, site, map) => {
    const previousDates = previousReservationsForMonth.get(site);
    if(!_.difference(currentDates, previousDates).length) {
      map.delete(site)
    }
  })

  return newReservations
}

// return map of months to the users watching that month
function getMonthsToWatchers(client) {
  const monthsToUsers = new Map()

  client.rezData.forEach((entry) => {
    entry.monthsToCheck.forEach((month) => {
      if(!monthsToUsers.has(month)) {
        monthsToUsers.set(month, [entry.userId])
      } else {
        monthsToUsers.get(month).push(entry.userId)
      }
    })
  })

  return monthsToUsers
}

module.exports.run = async (client) => {
  const monthsToWatchers = getMonthsToWatchers(client)
  const monthsToCheck = [...monthsToWatchers.keys()]

  console.log(`Checking: [${monthsToCheck}]`)

  for (const month of monthsToCheck) {
    // Check availability in month and get new availabilities
    const reservations = await rezClient.getReservations(month);
    const newReservations = getNewReservations(month, reservations)

    // notify watchers
    if(newReservations.size) {
      const newTable = rezClient.getAsTable(newReservations)
      const watchers = monthsToWatchers.get(month).map(userId => client.users.cache.get(userId))

      console.log(`Notifying [${watchers.length}] watchers about [${month}]`)

      for(const watcher of watchers) {
        watcher.send(`\`\`\`
New reservations for [${month}]:
${newTable}
\`\`\``);
      }
    }
  }
}

module.exports.conf = {
  cron: '*/30 * * * * *'  // every 30 seconds
}
