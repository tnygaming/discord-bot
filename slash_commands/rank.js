const Enmap = require("enmap")
const TableBoi = require("../modules/TableBoi")
const { Command, Subcommand, Parameter, OPTION_TYPE } = require("./util/Command")
const CommandUtil = require("./util/CommandUtil")
const discord = require('discord.js')

const ALLOWED_RANKS = [
  "Iron1",
  "Iron2",
  "Iron3",
  "Bronze1",
  "Bronze2",
  "Bronze3",
  "Silver1",
  "Silver2",
  "Silver3",
  "Gold1",
  "Gold2",
  "Gold3",
  "Platinum1",
  "Platinum2",
  "Platinum3",
  "Diamond1",
  "Diamond2",
  "Diamond3",
  "Immortal",
  "Radiant"
].reverse()

exports.run = async (client, interaction, args, subcommand) => {
  client.ranks = new Enmap({name: "ranks"})

  switch (subcommand) {
    case "set":         return await set(client, interaction, args)
    case "reset":       return await reset(client, interaction, args)
    case "get":         return await get(client, interaction, args)
    case "leaderboard": return await leaderboard(client, interaction, args)
  }
}

async function set(client, interaction, args) {
  const rank = args["rank"]

  if (!rank || !ALLOWED_RANKS.includes(rank)) {
    return showAllowedRanks(client, interaction) // invalid rank, show allowed ranks
  }
  
  const key = interaction.member.user.id
  const oldRank = client.ranks.get(key) // get old rank
  client.ranks.set(key, { userId: key, rank }) // set new rank
  
  // reply
  const msg = oldRank ? `rank updated from ${oldRank.rank} to ${rank}` : `rank set to ${rank}`
  const silent = args["silent"]
  CommandUtil.reply(client, interaction, msg, silent)
}

async function reset(client, interaction, args) {
  const userId = args["user"]
  const discordUser = await client.parseDiscordUser(`<@${userId}>`)

  client.ranks.delete(discordUser.id)
  CommandUtil.replyLoud(client, interaction, `${discordUser.username}'s rank has been reset`)
}

async function get(client, interaction, args) {
  const userId = args["user"]
  const discordUser = await client.parseDiscordUser(`<@!${userId}>`)

   // retrieve data for user
  const result = client.ranks.get(discordUser.id)
  
  // reply
  const msg = result ? `${discordUser.username}'s rank is: ${result.rank}` : `User not found`
  CommandUtil.replySilent(client, interaction, msg, args["silent"])
}

async function leaderboard(client, interaction, args) {
  // retrieve data and sort
  const ranks = client.ranks.array()
  const sortedRanks  = ranks.sort((a, b) => getRankIndex(a.rank) - getRankIndex(b.rank))

  // generate table
  const tableBoi = new TableBoi(["User", "Rank"])
  for (const data of sortedRanks) {
    tableBoi.addRow([await client.getDiscordUsername(data.userId), data.rank])
  }

  // reply
  const silent = args["silent"]
  CommandUtil.reply(client, interaction, `\`\`\`\n${tableBoi.getTableString()}\n\`\`\``, silent)
}

function showAllowedRanks(client, interaction) {
  const embedMsg = new discord.MessageEmbed()
      .setColor('#0099ff')
      .setTitle(`Invalid Rank`)
      .setDescription(`${"Available ranks:\n • "}${ALLOWED_RANKS.join("\n • ")}`)
  CommandUtil.replyEmbed(client, interaction, embedMsg, true)
}

function getRankIndex(rank) {
  return ALLOWED_RANKS.indexOf(rank) // todo: use Map instead of List for storing ranks to make this O(1)
}

exports.conf = {
  version: 2, // INCREMENT THIS IF YOU CHANGED THE COMMAND CONFIG, otherwise the changes won't be deployed. Can set to '-1' to always deploy(for testing)
  data: new Command("rank", "flex your rank")
  .addSubcommand(new Subcommand("set", "set own rank")
    .addParameter(new Parameter("rank", OPTION_TYPE.STRING, true, "rank to set"))
    .addParameter(new Parameter("silent", OPTION_TYPE.BOOLEAN, false, "only show message to myself")))
  .addSubcommand(new Subcommand("get", "see someone else's rank")
    .addParameter(new Parameter("user", OPTION_TYPE.USER, true, "target user")))
  .addSubcommand(new Subcommand("reset", "reset someone else's rank")
    .addParameter(new Parameter("user", OPTION_TYPE.USER, true, "target user")))
  .addSubcommand(new Subcommand("leaderboard", "show leaderboard")
    .addParameter(new Parameter("silent", OPTION_TYPE.BOOLEAN, false, "only show message to myself")))
  .build()
}
