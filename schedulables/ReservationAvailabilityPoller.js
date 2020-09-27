const enmap = require('enmap')
const discord = require('discord.js')
const rezClient = require('../modules/CampingReservationClient')
var _ = require('underscore')
const TableBoi = require("../modules/TableBoi");

const oldRezData = new enmap({name: "oldRezData"})

// reservations from previous run, months => campIds => sites => days
const oldData = oldRezData.ensure("default", new Map())

function getNewReservations(month, currentMonthData) {
  console.log(`currentMonthData: ${JSON.stringify(Array.from(currentMonthData))}`)

  const oldMonthData = _getOldAndSetCurrent(oldData, month, currentMonthData)

  if(!oldMonthData) {
    return currentMonthData // first run
  }

  console.log(`oldMonthData: ${JSON.stringify(Array.from(oldMonthData))}`)

  const newCamps = new Map()

  for (const [campId, currentSites] of currentMonthData.entries()) {
    // for each camp, calculate difference
    const oldSites = _getOldAndSetCurrent(oldMonthData, campId, currentSites)
    const newSites = getNewSites(currentSites, oldSites)

    if(newSites.size) {
      newCamps.set(campId, newSites)
    }
  }

  console.log(`newCamps: ${JSON.stringify(Array.from(newCamps))}`)

  return newCamps
}

function getNewSites(reservations, oldReservations) {
  const newReservations = new Map(reservations)
  newReservations.forEach((currentDates, site, map) => {
    const previousDates = oldReservations.get(site);
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

function _getOldAndSetCurrent(map, key, newValue) {
  const oldValue = map.get(key)
  map.set(key, newValue)
  return oldValue
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
      const embed = rezClient.getEmbed(newReservations, month)
      const watchers = monthsToWatchers.get(month).map(userId => client.users.cache.get(userId))

      console.log(`Notifying [${watchers.length}] watchers about [${month}]`)

      for(const watcher of watchers) {
        watcher.send(embed)
      }
    }
  }
}

module.exports.conf = {
  cron: '*/30 * * * * *'  // every 30 seconds
}
