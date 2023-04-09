const Discord = require("discord.js");
const db = require("./db");
const config = require('./config.json');
const syncSql = require("sync-sql")
const fx = require('./commands/fonctions')
const configA = {

    host: "localhost",
    user: "root",
    password: config.mdp,
    database : "mafia"
  }

  const { Client, Intents } = require('discord.js');
const { resourceLimits } = require("worker_threads");
  const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_PRESENCES] });
  fs = require('fs')
  require("discord-buttons")(client)

client.login(config.token);
client.commands = new Discord.Collection()

let tab = []

fs.readdir('./commands', (err, files) => {
    if(err) throw err
    files.forEach(file => {
        if(!file.endsWith('.js')) return
        const command = require(`./commands/${file}`)
        client.commands.set(command.name, command)
    })
})

client.on('message', message => {
    if(message.type !== 'DEFAULT' || message.author.bot) return
    const args = message.content.trim().split(/ +/g)
    const commandName = args.shift().toLowerCase()
    if(!commandName.startsWith(config.prefix)) return
    const command = client.commands.get(commandName.slice(config.prefix.length))
    if(!command) return
    command.run(message, args, client)
});


client.on('clickMenu', async (menu) => {
	if(menu.id == "menuRoles" || menu.id == "menuRoles2") {
        for(i = 0; i < menu.values.length; i++) tab.push(menu.values[i])
        let embed = await menu.channel.messages.fetch(fx.embedCompo)
        let query = `SELECT * FROM role WHERE id = '${tab[0]}'`
        for(i = 1; i < tab.length; i++) query+= ` OR id = ${tab[i]}`
        //console.log(query+= " ORDER BY nom ASC" )
        let result = fx.query(query+= " ORDER BY nom ASC")
        //if(embed.embeds[0].description == "-") desc = ''
        desc = ''
        for(i = 0; i < result.length; i++) desc += `**·** ${result[i].nom}\n`
        let nvembed = new Discord.MessageEmbed()
        .setTitle("Composition")
        .setDescription(desc)
        embed.edit(nvembed)
    }


    if(menu.id == "menumessager") fx.messager(menu.channel, menu.values)
    if(menu.id == "menuguerino") fx.guerino(menu.channel, menu.values)
    if(menu.id == "menushaman") fx.shaman(menu.channel, menu.values)
    if(menu.id == "menusdf") fx.sdf(menu.channel, menu.values)
    if(menu.id == "menuvotejour") fx.votejour(menu)
    if(menu.id == "menuvotemafiosos") fx.voteMafiosos(menu)
    if(menu.id == "menurevelateur") fx.revelateur(menu.channel, menu.values)
    if(menu.id == "menuangelos") fx.angelos(menu)
    if(menu.id == "menugentilgamin") fx.gentilGamin(menu)
    if(menu.id == "menusalegamin") fx.saleGamin(menu)
    if(menu.id == "menutueurmafioso") fx.tueurMafioso(menu) 
    if(menu.id == "menuchirurgien") fx.chirgurgienKill(menu)
    if(menu.id == "menubouffon") fx.bouffonint(menu)
    if(menu.id == "menupacifiste") fx.pacifiste(menu)
    if(menu.id == "menudoppel") fx.doppel(menu)

	//console.log(menu.id, menu.values, menu.clicker.id)
});


client.once('ready',  () => {
    fx.setClient(client)
    console.log("Good !");
    client.user.setStatus('invisible')
});