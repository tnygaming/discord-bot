const enmap = require('enmap')
const rezClient = require('../modules/CampingReservationClient')
const _ = require('underscore')

const oldRezData = new enmap({name: "oldRezData"})

// reservations from previous run, months => campIds => sites => days
const oldData = oldRezData.ensure("default", new Map())

function _getOldAndSetCurrent(map, key, newValue) {
  const oldValue = map.get(key)
  map.set(key, newValue)
  return oldValue
}

function getNewSites(reservations, oldReservations) {
  const newReservations = new Map(reservations)
  newReservations.forEach((currentDates, site, map) => {
    const previousDates = oldReservations.get(site);
    if (!_.difference(currentDates, previousDates).length) {
      map.delete(site)
    }
  })

  return newReservations
}

function getNewReservations(month, currentMonthData) {
  const oldMonthData = _getOldAndSetCurrent(oldData, month, currentMonthData)

  if (!oldMonthData) {
    // first run
    return currentMonthData
  }

  const newCamps = new Map()

  for (const [campId, currentSites] of currentMonthData.entries()) {
    // for each camp, calculate difference
    const oldSites = _getOldAndSetCurrent(oldMonthData, campId, currentSites)
    const newSites = getNewSites(currentSites, oldSites)

    if (newSites.size) {
      newCamps.set(campId, newSites)
    }
  }

  return newCamps
}

// return map of months to the users watching that month
function getMonthsToWatchers(client) {
  const monthsToUsers = new Map()

  client.rezData.forEach(entry => {
    entry.monthsToCheck.forEach(month => {
      if (!monthsToUsers.has(month)) {
        monthsToUsers.set(month, [entry.userId])
      } else {
        monthsToUsers.get(month).push(entry.userId)
      }
    })
  })

  return monthsToUsers
}

module.exports.run = async client => {
  const monthsToWatchers = getMonthsToWatchers(client)
  const monthsToCheck = [...monthsToWatchers.keys()]

  // console.log(`Checking months: [${monthsToCheck}]`)

  for (const month of monthsToCheck) {
    // Check availability in month and get new availabilities
    const reservations = await rezClient.getReservations(month);
    const newReservations = getNewReservations(month, reservations)

    // notify watchers
    if (newReservations.size) {
      const embed = rezClient.getEmbed(newReservations, month)
      const watchers = monthsToWatchers.get(month).map(userId => client.users.cache.get(userId))

      console.log(`Notifying [${watchers.length}] watchers about [${month}]`)

      for (const watcher of watchers) {
        if (watcher) {
          watcher.send(embed)
        }
      }
    }
  }
}

module.exports.conf = {
  // every 30 seconds
  cron: '*/30 * * * * *'
}
