const bent = require('bent')
const Bottleneck = require('bottleneck')
const TableBoi = require("./TableBoi");
const reservationClient = bent('https://www.recreation.gov/api/camps/availability/campground/', 'json', 200)
const limiter = new Bottleneck({
  minTime: 1000 // 1 request per second max
})

/*
Example api response:

    "campsites":{
          "100":{
             "availabilities":{
                "2020-10-01T00:00:00Z":"Reserved",
                "2020-10-02T00:00:00Z":"Available",
                ...
             },
             "site":"044"
          },
          ...
      }

*/

/* returns map of sites to the available days for that site. Only available sites are returned.
    ex: {
      "044": [11, 12, 13],
      "045": [13]
    }
*/
async function getReservations(month) {
  const campgroundId = "232447";  // currently hard-coded to Yosemite's Upper Pines
  var response = await reservationClient(`${campgroundId}/month?start_date=2020-${month}-01T00%3A00%3A00.000Z`);
  return _checkCampsites(response.campsites);
}

function getAsTable(reservations) {
  // convert date array to displayable string
  const displayReservations = [...reservations].map(([site, dates]) => [site, dates.toString()])
  return TableBoi.getTableString(["Site", "Dates"], displayReservations);
}

function _checkCampsites(campsites) {
  var campsiteMap = new Map()

  Object.entries(campsites).forEach(([id, campsite]) => {
    const dates = _getAvailabeDates(campsite)
    if(dates.length) {
      campsiteMap.set(campsite.site, dates)
    }
  });

  return new Map([...campsiteMap].sort())
}

function _getAvailabeDates(campsite) {
  return Object.entries(campsite.availabilities)
    .filter(([date, status]) => status === "Available")
    .map(([date, status]) => new Date(date).getDate() + 1);
}

module.exports.getReservations = getReservations
module.exports.getAsTable = getAsTable
