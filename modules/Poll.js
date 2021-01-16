const Discord = require("discord.js");
const uuid = require("uuid");

const numEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

/**
 * Quick and Dirty poller. 
 */
class Poll {
	constructor(msg, question, answers) {
		if (msg) {
			this.guildId = msg.guild.id;
			this.channelId = msg.channel.id;
			this.msgId = null;
			this.question = question;
			this.answers = answers;
			this.createdOn = Date.now();
			this.results = [];
			this.id = this._generateId();
		}
	}

  /**
   * Copy constructor
   */
	static copy (other) {
		let p = new Poll();

		p.guildId = other.guildId;
		p.channelId = other.channelId;
		p.msgId = other.msgId;
		p.question = other.question;
		p.answers = other.answers;
		p.createdOn = other.createdOn;
		p.results = other.results;
		p.id = other.id;

		return p;
	}


  /**
   * Writes a Poll to the input channel
   * @param {Discord.Channel} the channel to send the poll to
   */
	async start(channel) {
		const message = await channel.send({ embed: this._generateEmbed() })
		this.msgId = message.id;
		for (let i = 0; i < this.answers.length && i < 10; ++i) {
			try {
				await message.react(this.emojis[i]);
			} catch (error) {
				console.log(error);
			}
		}
		return message.id;
	}

	_generateEmbed() {
		let str = new String();

    for (let i = 0; i < this.answers.length && i < 10; i++) {
      str += `${numEmojis[i]}. ${this.answers[i]}\n`;
    }

		let embed = new Discord.MessageEmbed()
			.setColor("#0099FF")
			.setAuthor("📊" + this.question)
			.setDescription(str);

		return embed;
	}

	_generateId() {
    return uuid.v4();
	}


	async getPollMessage(discordClient) {
		try {
			return await discordClient.guilds.get(this.guildId).channels.get(this.channelId).fetchMessage(this.msgId);
		} catch (err) {
			return;
		}
	}
}

module.exports = Poll;