const { OPTION_TYPE } = require("./Command")

/**
 *  reply to a command with a message, can be made only visible to user by setting 'ephemeral' to true
 */
function reply(client, interaction, msg, ephemeral) {
  client.api.interactions(interaction.id, interaction.token).callback.post({data: {
    type: 4,
    data: {
      content: msg,
      flags: ephemeral ? 1 << 6 : undefined,
    }
  }})
}

/**
 *  reply to a command with a embed, can be made only visible to user by setting 'ephemeral' to true
 */
function replyEmbed(client, interaction, embed, ephemeral) {
  client.api.interactions(interaction.id, interaction.token).callback.post({data: {
    type: 4,
    data: {
      embeds: [embed],
      flags: ephemeral ? 1 << 6 : undefined,
    }
  }})
}

/**
 * reply to a command with a message that is visible to everyone
 */
function replyLoud(client, interaction, msg) {
	reply(client, interaction, msg, false)
}

/**
 * reply to a command with a message that is only visible to the user
 */
function replySilent(client, interaction, msg) {
	reply(client, interaction, msg, true)
}

/**
 * returns the name of the subcommand, or undefined if there is none
 */
function getSubcommand(interaction) {
  const topLevelOptions = interaction.data.options
  if(topLevelOptions && topLevelOptions.length) {
    return interaction.data.options[0].name
  }
}

/**
 * returns a map of the arguments for the command, with the key being the parameter name
 */
function getArgs(interaction) {
  const topLevelOptions = interaction.data.options
  if(topLevelOptions && topLevelOptions.length && topLevelOptions[0].type === OPTION_TYPE.SUB_COMMAND) {
    return _parseArgsFromOptions(topLevelOptions[0].options)
  } else {
    return _parseArgsFromOptions(topLevelOptions)
  }
}

function _parseArgsFromOptions(options) {
  var args = {}
  if(options) {
    for(const arg of options) {
      args[arg.name] = arg.value
    }
  }
  return args
}

module.exports.reply = reply
module.exports.replyEmbed = replyEmbed
module.exports.replyLoud = replyLoud
module.exports.replySilent = replySilent
module.exports.getSubcommand = getSubcommand
module.exports.getArgs = getArgs