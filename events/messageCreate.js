
const Collection = require('../models/collection.js')


let collection = {
    collectionSlug: "",
    channelId: "",
}

module.exports = async (client, message) => {
    const prefix = '!'
    if(!message.content.startsWith(prefix) || message.author.bot) return
	const args = message.content.slice(prefix.length).split(' ')
    let command = args.shift().toLowerCase()
	if(!command) return
	try {
        if (command === 'follow') {
            let collectionSlug = args[0]
            
            let collectionLookUp = await Collection.findOne({ collectionSlug: collectionSlug})
            if (collectionLookUp) {
                return message.reply(`${collectionSlug} is already followed in the channel: <#${collectionLookUp.channelId}>`)
            }
            let collections = await Collection.find()
        
            let channelId = message.channel.id

            for (let collection of collections) {
                if (collection.channelId === channelId) {
                    return message.reply(`<#${channelId}> is already used to follow ${collection.collectionSlug}`)
                }
            }
            
            collection = { collectionSlug, channelId }
            await Collection.create(collection)
            return message.reply(`The collection: ${collection.collectionSlug} is being followed successfully in the channel: <#${channelId}>`)
            
        } else if (command === 'unfollow') {
            let collectionSlug = args[0]
            await Collection.deleteOne({ collectionSlug: collectionSlug })
            return message.reply(`You have successfully unfollowed the collection: ${collectionSlug}.`)
        }
	} catch (error) {
		console.error(error);
		await message.channel.send({ content: 'There was an error while executing this command!', ephemeral: true });
	}
}