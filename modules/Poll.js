const Discord = require("discord.js");
const uuid = require("uuid");

const numEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

/**
 * Quick and Dirty poller. 
 */
class Poll {
    constructor(msg, question, answers, useNumberEmojis) {
        if (msg) {
            this.guildId = msg.guild.id;
            this.channelId = msg.channel.id;
            this.msgId = null;
            this.question = question;
            this.answers = answers;
            this.createdOn = Date.now();
            this.results = [];
      this.id = uuid.v4();
      this.useNumberEmojis = useNumberEmojis;
        }
    }

  /**
   * Copy constructor
   */
    static copy(other) {
        let p = new Poll();

        p.guildId = other.guildId;
        p.channelId = other.channelId;
        p.msgId = other.msgId;
        p.question = other.question;
        p.answers = other.answers;
        p.createdOn = other.createdOn;
        p.results = other.results;
    p.id = other.id;
    p.useNumberEmojis = other.useNumberEmojis;

        return p;
    }


  /**
   * Writes a Poll to the input channel
   * @param {Discord.Channel} the channel to send the poll to
   */
    async start(channel) {
    const emojis = this._getEmojis(channel.guild.emojis);
        const message = await channel.send({ embed: this._generateEmbed(emojis) });
    this.msgId = message.id;
        for (let i = 0; i < this.answers.length && i < 10; ++i) {
            try {
                await message.react(emojis[i]);
            } catch (error) {
                console.log(error);
            }
        }
        return message.id;
  }
  
  _getEmojis(emojiMgr) {
    if (this.useNumberEmojis) {
      return numEmojis;
    }
    return emojiMgr.cache.array()
      .filter(emoji => emoji.animated == false && emoji.available)
      .sort(() => 0.5 - Math.random());
  }

    _generateEmbed(emojis) {
        let str = ''

    for (let i = 0; i < this.answers.length && i < 10; i++) {
      str += `${emojis[i]}. ${this.answers[i]}\n`;
    }

        let embed = new Discord.MessageEmbed()
            .setColor("#0099FF")
            .setAuthor(`📊${this.question}`)
            .setDescription(str);

        return embed;
    }

    async getPollMessage(discordClient) {
        try {
            return await discordClient.guilds.get(this.guildId).channels.get(this.channelId).fetchMessage(this.msgId);
        } catch (err) {
            console.log(err)
        }
    }
}

module.exports = Poll;
