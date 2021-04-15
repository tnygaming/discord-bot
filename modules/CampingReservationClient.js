const bent = require('bent')
const discord = require('discord.js')
const TableBoi = require("./TableBoi");
const reservationClient = bent('https://www.recreation.gov/api/camps/availability/campground/', 'json', 200)
const MaxEmbedLength = 2048

// campgrounds to check, hardcoded for now, will make user-configurable if there is demand
const campgrounds = {
  232447: "Upper Pines",
  232450: "Lower Pines",
  232449: "North Pines"
}

// 
// Example api response:
//     "campsites":{
//           "100":{
//              "availabilities":{
//                 "2020-10-01T00:00:00Z":"Reserved",
//                 "2020-10-02T00:00:00Z":"Available",
//                 ...
//              },
//              "site":"044"
//           },
//           ...
//       }
// 

// returns map of of available days for each campsite
//  campId => siteId => available days
//  ex:
//  {
//    232447: {
//      "044": [11, 12, 13],
//      "045": [13]
//    },
//    232450: {
//      "001": [1]
//    }
//  }
// 
async function getReservations(month) {
  const year = new Date().getYear() + 1900  // 0-th year is 1990, thanks javascript
  let paddedmonth = month.toString().padStart(2, '0') // Pad with 0 if needed, API uses two-char months

  let results = new Map();

  // check each campsite and calculate availabilities
  await Promise.all(Object.keys(campgrounds).map(async campId => {
    let response = await reservationClient(`${campId}/month?start_date=${year}-${paddedmonth}-01T00%3A00%3A00.000Z`);
    results.set(campId, _checkCampsites(response.campsites))
  }));

  return results
}

function getEmbed(reservations, month) {
  let tableStr = ""

  // generate table for each campsite
  for (const [campId, availableSites] of reservations.entries()) {
    if (availableSites.size) {
      const rows = [...availableSites].map(([site, dates]) => [site, dates.toString()])
      const campName = `[${campgrounds[campId]}](https://www.recreation.gov/camping/campgrounds/${campId}/availability)`
      tableStr += `${campName}\`\`\`${TableBoi.getTableString(["Site", "Dates"], rows)}\`\`\` \n`
    }
  }

  if (tableStr.length > MaxEmbedLength) {
    tableStr = tableStr.substring(0, MaxEmbedLength)
  }

  return new discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle(`Reservations for Month ${month} `)
    .setDescription(`${tableStr}`)
}

function _checkCampsites(campsites) {
  let campsiteMap = new Map()

  Object.entries(campsites).forEach(([, campsite]) => {
    const dates = _getAvailabeDates(campsite)
    if (dates.length) {
      campsiteMap.set(campsite.site, dates)
    }
  });

  return new Map([...campsiteMap].sort())
}

function _getAvailabeDates(campsite) {
  return Object.entries(campsite.availabilities)
    .filter(([, status]) => status === "Available")
    .map(([date]) => new Date(date).getUTCDate())
}

module.exports.getReservations = getReservations
module.exports.getEmbed = getEmbed
