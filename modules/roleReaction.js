const firstMessage = require('../modules/firstMessage')

module.exports = async (client) => { 

    const channelId = '797391761948409856'
    const getEmoji = emojiName => 
        client.emojis.cache.find((emoji) => emoji.name === emojiName)

    const emojis = {
        fuckValorant: 'CS:GO',
        gotRice: 'Tarkov',
        smokeTrees: 'Apex',
        passTheAWP: 'Ivan'
    }

    const reactions = []

    let emojiText = 'Testing 1 2 3\n'
    for (const key in emojis) {
        const emoji = getEmoji(key)
        reactions.push(emoji)

        const role = emojis[key]
        emojiText += `${emoji} = ${role}\n`
    }

    firstMessage(client, channelId, emojiText, reactions)

    const handleReaction = (reaction, user, add) => {
        if (user.id === '797593116529000468') {
            return
        }

        //console.log(reaction)

        const emoji = reaction._emoji.name

        const { guild } = reaction.message

        const roleName = emojis[emoji]
        if (!roleName) {
            return 
        }

        const role = guild.roles.cache.find(role => role.name === roleName)
        const member = guild.members.cache.find(member => member.id === user.id)

        if (add) {
            member.roles.add(role)
        } else {
            member.roles.remove(role)
        }
    }

    client.on('messageReactionAdd', (reaction, user) => {
        if (reaction.message.channel.id === channelId){
            handleReaction(reaction, user, true)
        }
    })

    client.on('messageReactionRemove', (reaction, user) => {
        if (reaction.message.channel.id === channelId){
            handleReaction(reaction, user, false)
        }
    })

};

  