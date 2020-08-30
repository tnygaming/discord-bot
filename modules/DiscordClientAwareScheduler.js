const schedule = require('node-schedule');

/**
 * Scheduler thats aware of the discord client
 */
class DiscordClientAwareScheduler {

  constructor(client) {
    this.client = client
  }

  register(schedulableFileName) {
    console.log(`Loading schedulable: ${schedulableFileName}`)
    const props = require(`../schedulables/${schedulableFileName}`)
    schedule.scheduleJob(props.conf.cron, () => {
      const startTime = Date.now()
      console.log(`begin executing ${schedulableFileName}`)
      props.run(this.client)
        .then(result => console.log(`completed executing ${schedulableFileName} in ${Math.floor((Date.now() - startTime)/1000)} seconds`))
        .catch(error => console.error(error))
    })
  }
}
module.exports = DiscordClientAwareScheduler
