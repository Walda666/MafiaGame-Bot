const db = require('../db')
const discord = require("discord.js")
const fx = require('./fonctions')
const { MessageMenuOption, MessageMenu, MessageActionRow } = require("discord-buttons")
module.exports = {
    run: async (message, args, client) => {

        let embed = new discord.MessageEmbed()
        .setTitle("Compositon")
        .setDescription("-")

        let roles = fx.query('SELECT id, nom FROM role')

        let selection = new MessageMenu()
            .setID("menuRoles")
            .setMaxValues(25)
            .setMinValues(1)
            .setPlaceholder("Séléctionnez les rôles à ajouter dans la composition")

            let selection2 = new MessageMenu()
            .setID("menuRoles2")
            .setMaxValues(21)
            .setMinValues(1)
            .setPlaceholder("Séléctionnez les rôles à ajouter dans la composition")

        for (i = 0; i < 25; i++) {
            let option = new MessageMenuOption()
                .setLabel(roles[i].nom)
                .setValue(roles[i].id.toString())
                .setEmoji("➕")
            selection.addOption(option)
        }
        for (i = 25; i < 46; i++) {
            let option = new MessageMenuOption()
                .setLabel(roles[i].nom)
                .setValue(roles[i].id.toString())
                .setEmoji("➕")
            selection2.addOption(option)
        }


        const row = new MessageActionRow()
            .addComponents(selection)

        let sendEmb = await message.channel.send(embed, selection)
        await message.channel.send("-",selection2)
        fx.setEmbedcompo(sendEmb.id)
    },
    name: 'create'
}