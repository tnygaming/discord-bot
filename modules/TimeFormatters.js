

module.exports.formatSeconds = function formatSeconds(inputSeconds) {
  const minutes = Math.floor(inputSeconds / 60)
  const seconds = inputSeconds % 60
  return `${minutes} ${minutes == 1 ? 'minute' : 'minutes'} and ${seconds} ${seconds == 1 ? 'second' : 'seconds'}`
}
