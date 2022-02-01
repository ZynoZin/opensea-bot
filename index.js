const { Client, Intents, MessageEmbed } = require('discord.js');
const axios = require('axios');
const messageCreate = require('./events/messageCreate.js')
const RateLimiter = require('./RateLimiter');
const fetchAndRetryIfNecessary = require('./fetchAndRetryIfNecessary');

const tokenBucket = new RateLimiter({ 
  maxRequests: 1, 
  maxRequestWindowMS: 2000,
});
const Collection = require('./models/collection.js')
const mongoose = require('mongoose')
const config = require('./config.json');

const myIntents = new Intents(32767);
const client = new Client({ intents: myIntents})

const api = axios.create({
  baseURL: 'https://api.opensea.io/api/v1',
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

mongoose.connect(config.dbURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async (res) => {
    console.log("Connected to Mongo Database.")

    client.on('ready', async () => {
      console.log('Bot is Online!');
      let collectionsFromDB = await Collection.find()
   
      let i = 0;
      while (true) {
        if (!collectionsFromDB.length == 0) {
          let collections = collectionsFromDB.map(slug => ({ ...slug._doc, lastUpdated: new Date() }));
          
          const collection = collections[i];
          const timestamp = Math.floor(collection.lastUpdated.getTime() / 1000);

          await fetchAndRetryIfNecessary(
            () => tokenBucket.acquireToken(() => api.get(
              `events?collection_slug=${collection.collectionSlug}&only_opensea=true&offset=0&limit=20&occurred_after=${timestamp}&event_type=created`,
              { headers: { 'X-API-KEY': config.apiKey, Accept: 'application/json' } },
            ))
          ).then((response) => {
            collection.lastUpdated = new Date();

            const assetEvents = response.data.asset_events
              .filter((event) => event.auction_type === 'dutch')
              .reverse();
            console.log(assetEvents.length + ' ' + collection.collectionSlug);

            return Promise.all(
              assetEvents.map((assetEvent) => {
                let price = assetEvent.ending_price / Math.pow(10, 18);
                price = price.toFixed(2);
                //Create an embed for each assete that will be sent in Discord holding the link to the asset, the image and the price.
                const assetName = assetEvent.asset.name || `${assetEvent.asset.collection.name} #${assetEvent.asset.token_id}`;
                const assetEmbed = new MessageEmbed()
                  .setColor('BLUE')
                  .setTitle(
                    `${assetName} is on sale for Ξ ${price}`
                  )
                  .setURL(`${assetEvent.asset.permalink}?ref=0x85E0aAfDb0D6516a007B3C16672B00731614d6AE`)
                  .setImage(assetEvent.asset.image_url)
                  .setTimestamp();
                
                return client.channels.cache
                  .get(collection.channelId)
                  .send({ embeds: [assetEmbed] });
              })
            );
          }).catch(console.error);
          collectionsFromDB = await Collection.find()
          i++;
          if (!collections[i]) i = 0;
        } else {
            while (collectionsFromDB.length== 0) {
                await sleep(10000)
                collectionsFromDB = await Collection.find()
            }
        }
      }
    });

    client.on("messageCreate", (message) => {
      messageCreate(client,message)
    })

    client.login(config.token);
  })
  .catch(error => console.log(error))

