# OpenSea Discord Events Bot
A discord bot that tracks any new NFT sales made on the OpenSea platform in realtime using the provided API.

# Demo
<img src="https://imgur.com/iUedP81.png"
     alt="NFT"
     style="float: left; margin-right: 10px;" />
# Preparing your workspace
First things first, after you pull the code, make sure to execute 
```shell
npm install
```
Then add your OpenSea API, your link to your Mongo database and the token of your bot to the `config.json` file.


Finally, invite your bot to your server

# Following a specific collection
Go to any desired channel and post the following command to follow a collection only in that channel
```
!follow bored-ape-yacht-club
```
`bored-ape-yacht-club` being an example of a collection slug.


You can also unfollow a collection with this command:
```
!unfollow bored-ape-yacht-club
```

# Tada!
Now you can set back, relax and stay up to date with the latest NFT sales. 
