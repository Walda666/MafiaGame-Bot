const { MessageActionRow, MessageButton } = require('discord.js');
const fx = require("./fonctions")
module.exports = {
    async run(message, args, client) {
       
        const camps = {
            0 : "Citoyens",
            1 : "Mafiosos",
            2 : "Neutres",
        }

        // On récup les roles et joueurs de la compo qu'on shuffle
        let idgame = fx.getLastGame()
        let comporoles = fx.query(`SELECT R.id AS bonid, R.nom, R.description, R.camp, E.* FROM composition C JOIN role R ON R.id = C.identifiant JOIN etattemplate E ON E.id = R.etattemplate WHERE type = 1 AND partie = '${idgame}'`)
        let compojoueurs = fx.query(`SELECT R.id, R.discordid FROM composition C JOIN joueur R ON R.id = C.identifiant WHERE type = 2 AND partie = '${idgame}'`)
        let tabRolesNoshuffle = []
        let tabJoueursNoshuffle = []
        for(i = 0; i < comporoles.length; i++) tabRolesNoshuffle.push([comporoles[i].bonid, comporoles[i].nom, comporoles[i].description, comporoles[i].camp, comporoles[i].nbuse, comporoles[i].choixbouffon, comporoles[i].chipoison, comporoles[i].chisave, comporoles[i].target, comporoles[i].couple, comporoles[i].anneau, comporoles[i].rolevole, comporoles[i].etatrolevole, comporoles[i].couverture, comporoles[i].briques ])
        for(i = 0; i < compojoueurs.length; i++) tabJoueursNoshuffle.push([compojoueurs[i].id, compojoueurs[i].discordid])

        tabRoles = fx.shuffleArray(fx.shuffleArray(fx.shuffleArray(tabRolesNoshuffle)))
        tabJoueurs = fx.shuffleArray(fx.shuffleArray(fx.shuffleArray(tabJoueursNoshuffle)))
        // Attribution des rôles
        for(i = 0; i < tabJoueurs.length; i++) {
            let joueur = await client.users.fetch(tabJoueurs[i][1])
            // Add db + envoie au joueur : (décommenter)
            //joueur.send(fx.embNotag("Attribution de rôle", `Tu es **${tabRoles[i][1]}**, tu appartiens au camp des ${camps[tabRoles[i][3]]}\n\n${tabRoles[i][2]}`, "BLUE"))
            //console.log(`${joueur.username} -> Tu es **${tabRoles[i][1]}**, tu appartiens au camp des ${camps[tabRoles[i][3]]}\n\n${tabRoles[i][2]}`)
            
            // query add etat chiante
            let queryetat = ``
            let queryetatvalues = ``
            if(tabRoles[i][4] != null) {
                queryetat+= `nbuse, `
                queryetatvalues += `'${tabRoles[i][4]}', `
            }
            if(tabRoles[i][5] != null) {
                queryetat+= `choibouffon, `
                queryetatvalues += `'${tabRoles[i][5]}', `
            }
            if(tabRoles[i][6] != null) {
                queryetat+= `chisave, `
                queryetatvalues += `'${tabRoles[i][6]}', `
            }
            if(tabRoles[i][7] != null) {
                queryetat+= `chipoison, `
                queryetatvalues += `'${tabRoles[i][7]}', `
            }
            if(tabRoles[i][8] != null) {
                queryetat+= `target, `
                queryetatvalues += `'${tabRoles[i][8]}', `
            }
            if(tabRoles[i][9] != null) {
                queryetat+= `couple, `
                queryetatvalues += `'${tabRoles[i][9]}', `
            }
            if(tabRoles[i][10] != null) {
                queryetat+= `anneau, `
                queryetatvalues += `'${tabRoles[i][10]}', `
            }
            if(tabRoles[i][11] != null) {
                queryetat+= `rolevole, `
                queryetatvalues += `'${tabRoles[i][11]}', `
            }
            if(tabRoles[i][12] != null) {
                queryetat+= `etatrolevole, `
                queryetatvalues += `'${tabRoles[i][12]}', `
            }
            if(tabRoles[i][13] != null) {
                queryetat+= `couverture, `
                queryetatvalues += `'${tabRoles[i][13]}', `
            }
            if(tabRoles[i][14] != null) {
                queryetat+= `briques, `
                queryetatvalues += `'${tabRoles[i][14]}', `
            }
            
            let idetat = fx.query(`INSERT INTO etat(${queryetat.slice(0, -2)}) VALUES(${queryetatvalues.slice(0, -2)})`).insertId
            fx.query(`INSERT INTO deroulement(partie, joueur, role, etat, mort, vote) VALUES('${idgame}', '${tabJoueurs[i][0]}', '${tabRoles[i][0]}', '${idetat}', '0', '1')`)
        }

        fx.jour(1)


},
name: 'start'
}