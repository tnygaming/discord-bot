/*
 * SLASH COMMAND MIGRATION GUIDE:
 *
 * 1. Move command file from "/commands" to "/slash_commands" (or archive and make a copy)
 * 2. Define exports.conf (old exports.conf and exports.help are not needed anymore)
 *      - version: Used to determine if we need to re-provision a command, increment this each time the command's config is updated
 *			- data: JSON object that represents the command's config. Can use this class to help build it.  See "/slash_commands/rank.js" for an example
 * 3. Change parameters of exports.run from "(client, message, args, level)" to "(client, interaction, args, subcommand)" 
 *      - args: now a map instead of an array.  ex: args["rank"] will return the parameter named "rank"
 *      - subcommand: name of the subcommand if applicable (previously args[0])
 * 4. Interfaces:
 *		- eplying to command: instead of "channel.send(msg)", use "CommandUtil.reply(client, interaction, msg, ephemeral)" or similar methods
 *
 */

// small parent class for building nested json data
class JsonComponent {
	constructor() { this.data = {} }
	build() { return this.data }
}

/**
* Command Documentation:  https://discord.com/developers/docs/interactions/application-commands#create-global-application-command
* JSON builder: https://rauf.wtf/slash/
*
* NOTE: this does not validate that the command is defined correctly, please do it yourself
*
* NOTE: currently only supports subcommands, not subcommand-groups.
*         subcommand-group don't do anything yet, for more info: https://discord.com/developers/docs/interactions/application-commands#subcommands-and-subcommand-groups
*
* todo: permissions
*/
class Command extends JsonComponent {

  constructor(name, description) {
		super()
    this.data = {
      "name": name,
      "description": description,
      "options": []
    }
  }

  addParameter(parameter) {
		this.data.options.push(parameter.build())
		return this
  }

  addSubcommand(subcommand) {
		this.data.options.push(subcommand.build())
		return this;
  }
}

class Subcommand extends JsonComponent {
	constructor(name, description) {
		super()
    this.data = {
			"type": 1,
      "name": name,
      "description": description,
			"options": []
    }
  }

	addParameter(parameter) {
		this.data.options.push(parameter.build())
		return this
  }
}

class Parameter extends JsonComponent {
	constructor(name, type, required, description) {
		super()
    this.data = {
      "name": name,
      "description": description,
      "type": type,
			"required": required,
			"choices": []
    }
  }

	addChoice(name, value) {
		this.data.choices.push({
      "name": name,
      "value": value
		})
		return this
	}
}

// enum for specifying a command's parameter's data-type
const OPTION_TYPE = {
	SUB_COMMAND: 1,
	SUB_COMMAND_GROUP: 2,
	STRING: 3,
	INTEGER: 4,
  BOOLEAN: 5,
	USER: 6,
	CHANNEL: 7,
	ROLE: 8,
  MENTIONABLE: 9, // users AND roles
	NUMBER: 10   // double
}

module.exports.CommandUtil = {
	reply: function reply(client, interaction, msg, ephemeral) {
	  client.api.interactions(interaction.id, interaction.token).callback.post({data: {
	    type: 4,
	    data: {
	      content: msg,
	      flags: ephemeral ? 1 << 6 : undefined,
	    }
	  }})
	}
}

function reply(client, interaction, msg, ephemeral) {
  client.api.interactions(interaction.id, interaction.token).callback.post({data: {
    type: 4,
    data: {
      content: msg,
      flags: ephemeral ? 1 << 6 : undefined,
    }
  }})
}


module.exports = { Command, Subcommand, Parameter, OPTION_TYPE }
