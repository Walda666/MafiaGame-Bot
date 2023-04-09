const { MessageActionRow, MessageButton } = require('discord.js');
const fx = require("./fonctions")
const db = require("../db")
module.exports = {
    async run(message, args, client) {
       
        if(args.length != 1) return message.channel.send(fx.emb(message, "Erreur", "Il faut spécifier un prénom ou pseudo\nCelui ci sera utilisé pour vous séléctionner lors d'un vote ou une action", "RED" ))


        let pseudo = args[0]
        let discordid = message.author.id

        let result = fx.query(`SELECT * FROM joueur WHERE discordid = '${discordid}'`)
        if(result.length != 0) return message.channel.send(fx.emb(message, "Erreur", "Vous êtes déjà enregistré", "RED" ))

        
        fx.query(`INSERT INTO joueur(nom, discordid, discordname, win, play) VALUES('${pseudo}', '${discordid}', '${message.author.username}', 0, 0)`)
        message.react("✅")
},
name: 'adduser'
}