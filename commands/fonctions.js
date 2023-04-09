const discord = require("discord.js")
const configA = require("../config.json")
const syncSql = require("sync-sql")
const db = require("../db")
const { MessageMenuOption, MessageMenu, MessageActionRow } = require("discord-buttons")
module.exports = {
    config: {

        host: "localhost",
        user: "root",
        password: configA.mdp,
        database : "mafia"
      },

    emb: function(messagee, titre, messag, couleur) {
        embed = new discord.MessageEmbed()
        .setColor(couleur)
        .setTitle(titre)
    
        .setDescription(`${messag} 
    
    ${messagee.author}`)
        .setFooter(`Mafia`)
        return embed
    },

    embNotag: function(titre, messag, couleur) {
        embed = new discord.MessageEmbed()
        .setColor(couleur)
        .setTitle(titre)
    
        .setDescription(`${messag}`)
        .setFooter(`Mafia`)
        return embed
    },

    pagin: function(message, pages, userr) {
        message.react("⬅️")
        message.react("➡️")
        const filter = (reaction, user) => true
        let compteur = 0
        const collector = message.createReactionCollector(filter, {max: 1});
        collector.on('collect', (reaction, user) => {
            if(reaction.emoji.name === "➡️" && !user.bot && user.id == userr.id) {
                message.reactions.resolve("➡️").users.remove(user)
                if(compteur == pages.length-1) {
                    message.edit(pages[0])
                    compteur = 0
                } else {
                    message.edit(pages[compteur+1])
                    compteur++
                }
            }
            if(reaction.emoji.name === "⬅️" && !user.bot && user.id == userr.id) {
                message.reactions.resolve("⬅️").users.remove(user)
                if(compteur == 0) {
                    message.edit(pages[pages.length-1])
                    compteur = pages.length -1
                } else {
                    message.edit(pages[compteur-1])
                    compteur--
                }
            }
        });
    },

    shuffleArray : function(tableau) {
        let nouveautab = []
        for (let j = tableau.length - 1; j >= 0; j--) {
            let random = Math.floor(Math.random() * tableau.length)
                nouveautab.push(tableau[random])
                tableau.splice(random, 1)
        }
        return nouveautab

    },

    query: function(query) {
        return syncSql.mysql(this.config, query).data.rows
    },

    getLastGame: function() {
        return this.query(`SELECT * FROM partie ORDER BY date DESC`)[0].id
    },

    getCompo: function() {
        let idgame = this.getLastGame()
        return this.query(`SELECT J.discordid, R.id AS roleid, J.id AS joueurid, J.nom AS joueurnom, R.nom AS rolenom, R.camp, D.vote, E.* FROM deroulement D JOIN joueur J ON J.id = D.joueur JOIN partie P ON P.id = D.partie JOIN role R ON R.id = D.role JOIN etat E ON E.id = D.etat WHERE mort <= 1 AND D.partie = '${idgame}'`)
    },

    getRoleById: function(id) {
        return this.query(`SELECT R.id, R.nom FROM role R JOIN deroulement D ON D.role = R.ID WHERE joueur = '${id}' AND partie = '${this.getLastGame()}'`)
    },

    getIdByRole: function(role) {
        return this.query(`SELECT joueur FROM deroulement WHERE role = '${role}' AND partie = '${this.getLastGame()}'`)
    },

    getInfospartie: function() {
        return this.query(`SELECT * FROM infospartie WHERE partie = '${this.getLastGame()}'`)[0]
    },

    nbUse: function(role) {
        return this.query(`SELECT E.nbuse FROM etat E JOIN deroulement D ON E.id = D.etat WHERE D.partie = '${this.getLastGame()}' AND D.role = '${role}'`)[0].nbuse
    },

    createmenu: function(options, placeholder, emoji, menuid, max) {
        if(options.length <= 25) {
            let selection = new MessageMenu()
                .setID(menuid)
                .setMaxValues(max)
                .setMinValues(1)
                .setPlaceholder(placeholder)

                for (i = 0; i < options.length; i++) {
                    let option = new MessageMenuOption()
                        .setLabel(options[i][1])
                        .setValue(options[i][0])
                        .setEmoji(emoji)
                    selection.addOption(option)
                }

                return [selection]
            } else {
                let selection1 = new MessageMenu()
                .setID(menuid)
                .setMaxValues(max)
                .setMinValues(1)
                .setPlaceholder(placeholder)

                let selection2 = new MessageMenu()
                .setID(menuid)
                .setMaxValues(max)
                .setMinValues(1)
                .setPlaceholder(placeholder)

                for (i = 0; i < 25; i++) {
                    let option = new MessageMenuOption()
                        .setLabel(options[i][1])
                        .setValue(options[i][0])
                        .setEmoji(emoji)
                    selection1.addOption(option)
                }

                for (i = 25; i < options.length; i++) {
                    let option = new MessageMenuOption()
                        .setLabel(options[i][1])
                        .setValue(options[i][0])
                        .setEmoji(emoji)
                    selection2.addOption(option)
                }
                return [selection1, selection2]
            }
    },

    prestart: async function() {

        let compo = this.getCompo()
        let alivetab = []
        for(i = 0; i < compo.length; i++) alivetab.push([compo[i].joueurid.toString(), compo[i].joueurnom])

        for(i = 0; i < compo.length; i++) {
            let joueur = await this.client.users.fetch(compo[i].discordid)

            switch(compo[i].roleid) {
                case 1:
                    console.log("un")
                    break
                case 5:
                    console.log("5")
                    break
                case 6:
                    if(1) {
                        const filter = () => true
                        let embed = this.embNotag("Choix Bouffon", "Fais ton choix en mettant une réaction sur ce message\n\n💪 | Fort\n💡 | Intelligent")
                        let embedSend = await joueur.send(embed)
                        await embedSend.react("💪")
                        await embedSend.react("💡")

                        const collector = embedSend.createReactionCollector(filter)
                        collector.on('collect', (reaction, user) => {
                            if(reaction.emoji.name === '💪' && !user.bot) {
                                embedSend.edit(embed.setDescription("Tu as choisit de devenir fort !"))
                                this.query(`UPDATE deroulement D JOIN etat E ON D.etat = E.id SET E.choixbouffon = 'fort', nbuse = '2' WHERE D.role = '6' AND D.partie = '${this.getLastGame()}'`)
                                collector.stop()
                            }
                            if(reaction.emoji.name === '💡' && !user.bot) {
                                embedSend.edit(embed.setDescription("Tu as choisit de devenir intelligent !"))
                                this.query(`UPDATE deroulement D JOIN etat E ON D.etat = E.id SET E.choixbouffon = 'intelligent', nbuse = '3' WHERE D.role = '6' AND D.partie = '${this.getLastGame()}'`)
                                collector.stop()
                            }
                        })
                    }
                    break
                case 7:
                    if(1) {
                        let freres = this.getIdByRole(7)
                        if(freres.length < 2) joueur.send("Il n'y a pas d'autre frère Bianchi")
                        let queryFreres = `SELECT * FROM joueur WHERE id = '${freres[0].joueur}'`
                        for(j = 1; j < freres.length; j++) queryFreres += ` OR id = '${freres[j].joueur}'`
                        let resultFreres = this.query(queryFreres)
                        
                        let descFreres = "Voici l'identité de ton/tes frère(s) : "
                        for(j = 0; j < resultFreres.length; j++) {
                            if(resultFreres[j].discordid != joueur.id) descFreres += `**${resultFreres[j].nom}** `
                        }
                        joueur.send(descFreres)
                    }
                    break
                case 8:
                    console.log("8")
                    break
                case 9:
                    console.log("9")
                    break
                case 11:
                    console.log("11")
                    break
                case 13:
                    console.log("13")
                    break
                case 14:
                    console.log("14")
                    break
                case 15:
                    console.log("15")
                    break
                case 16:
                    console.log("16")
                    break
                case 17:
                    console.log("17")
                    break
                case 18:
                    console.log("18")
                    break
                case 19:
                    if(1) {
                        let menus = this.createmenu(alivetab, "Séléctionnez un joueur a voler à sa mort", "👉", "menudoppel", 1)
                        if(menus.length == 1)  joueur.send("Action - DoppelGänger", menus[0])
                        else {
                            joueur.send("Action - DoppelGänger", menus[0])
                            joueur.send("Action - DoppelGänger - suite", menus[1])
                        }
                    }
                    break
                case 20:
                    console.log("20")
                    break
                case 21:
                    console.log("21")
                    break
                case 22:
                    console.log("22")
                    break
                case 23:
                    console.log("23")
                    break
                case 25:
                    console.log("25")
                    break
                case 26:
                    console.log("26")
                    break
                case 27:
                    console.log("27")
                    break
                case 28:
                    console.log("28")
                    break
                case 29:
                    console.log("29")
                    break
                case 30:
                    console.log("30")
                    break
                case 31:
                    console.log("31")
                    break
                case 32:
                    console.log("32")
                    break
                case 33:
                    console.log("33")
                    break
                case 34:
                    console.log("34")
                    break
                case 35:
                    console.log("35")
                    break
                case 36:
                    console.log("36")
                    break
                case 37:
                    console.log("37")
                    break
                case 38:
                    console.log("38")
                    break
                case 39:
                    console.log("39")
                    break
                case 40:
                    console.log("40")
                    break
                case 41:
                    console.log("qa")
                    break
                case 42:
                    if(1) {
                        let freres = this.getIdByRole(42)
                        if(freres.length < 2) joueur.send("Il n'y a pas d'autre frère Luciano")
                        let queryFreres = `SELECT * FROM joueur WHERE id = '${freres[0].joueur}'`
                        for(j = 1; j < freres.length; j++) queryFreres += ` OR id = '${freres[j].joueur}'`
                        let resultFreres = this.query(queryFreres)
                        
                        let descFreres = "Voici l'identité de ton/tes frère(s) : "
                        for(j = 0; j < resultFreres.length; j++) {
                            if(resultFreres[j].discordid != joueur.id) descFreres += `**${resultFreres[j].nom}** `
                        }
                        joueur.send(descFreres)
                    }
                    break
                case 43:
                    console.log("43")
                    break
                case 44:
                    console.log("44")
                    break
                case 45:
                    console.log("45")
                    break
                case 46:
                    console.log("46")
                    break
            }
            
        }

        setTimeout(() => {
            this.jour()
        }, 10000);
    },

    jour: async function() {
        console.log(`Jour ${this.cycle}`)
        this.chansend.send(`C'est le jour ${this.cycle} !`)
        for(i = 0; i < this.infosJour.length; i++) this.chansend.send(this.infosJour[i])
        this.infosJour = []
        // gérer mort
        let mortsnuit = this.query(`SELECT J.nom AS joueurnom, D.joueur AS joueurid, R.nom AS rolenom, D.role AS roleid, D.etat FROM deroulement D JOIN role R ON R.id = D.role JOIN joueur J ON J.id = D.joueur WHERE D.mort = 1 AND partie = '${this.getLastGame()}'`)
        let hasAngelo = this.query(`SELECT J.discordid FROM deroulement D JOIN joueur J ON J.id = D.joueur WHERE mort = 0 AND D.partie = '${this.getLastGame()}' AND role = '4'`)
        let hasDoppel = this.query(`SELECT J.discordid, E.target FROM deroulement D JOIN joueur J ON J.id = D.joueur JOIN etat E ON E.id = D.etat WHERE mort = 0 AND D.partie = '${this.getLastGame()}' AND role = '19'`)
        let targetDoppel = 0
        if(hasDoppel) targetDoppel = hasDoppel[0].target

        // Sasquatch si égalité
        if(mortsnuit.length == 0) {
             if(this.getInfospartie().sasquatch == 0) {
                let hasSasquatch = this.query(`SELECT discordid FROM deroulement WHERE role = '18' AND partie = '${this.getLastGame()}' AND mort = 0`)
                if(hasSasquatch.length > 0) {
                    this.query(`UPDATE infospartie SET sasquatch = '1' WHERE partie = '${this.getLastGame()}'`)
                    let gars = this.client.users.fetch(hasSasquatch[0].discordid)
                    gars.send(this.embNotag("Info", `Personne n'est mort cette nuit, tu passes dans le camp des mafiosos !`))
                }
            }
        }
        
        for(j = 0; j < mortsnuit.length; j++) {
            // Cas spécial lépreux
            if(mortsnuit[j].roleid == 17) {
                let alphabet = this.query(`SELECT J.nom AS joueurnom, D.joueur AS joueurid, R.nom AS rolenom, D.role AS roleid, D.etat FROM deroulement D JOIN joueur J ON J.id = D.joueur JOIN partie P ON P.id = D.partie JOIN role R ON R.id = D.role WHERE mort = '0' AND D.partie = '${this.getLastGame()}' ORDER BY J.nom ASC`)
                let passe = 0
                let final = ""
                for(l = 0; l < alphabet.length; l++) {
                    if(passe == 1) {
                        final = [alphabet[l].joueurid, alphabet[l].joueurnom, alphabet[l].rolenom, alphabet[l].etat, alphabet[l].roleid]
                        passe = 2
                    } 
                    else {
                        if(alphabet[l].joueurid == 17) passe = 1
                    }
                }
                if(final == "") final = [alphabet[0].joueurid, alphabet[0].joueurnom, alphabet[0].rolenom, alphabet[l].etat, alphabet[0].roleid]
                
                this.chansend.send(this.embNotag("Mort", `${final[1]} est mort cette nuit. Il était ${final[2]}`, "RED"))
                if(hasAngelo.length > 0) this.mortAngelos(final[0])
                else this.query(`UPDATE deroulement SET mort = '3' WHERE partie = '${this.getLastGame()}' AND joueur = '${final[0]}'`)
                
                // doppel
                if(final[0] == targetDoppel) {
                    let doppelid = this.query(`SELECT J.discordid FROM joueur J JOIN deroulement D ON J.id = D.joueur WHERE partie = '${this.getLastGame()}' AND D.role = '19'`)[0].discordid
                    let doppel = this.client.users.fetch(doppelid)
                    doppel.send(this.embNotag("Info", `Le joueur que tu avais ciblé vient de mourir. Tu voles donc son rôle : **${final[2]}**`))
                    this.query(`UPDATE deroulement SET role = '${final[4]}', etat = '${final[3]}' WHERE partie = '${this.getLastGame()}' AND role = '19'`)
                }


            } else {
                this.chansend.send(this.embNotag("Mort", `${mortsnuit[j].joueurnom} est mort cette nuit. Il était ${mortsnuit[j].rolenom}`, "RED"))
                if(hasAngelo.length > 0) this.mortAngelos(mortsnuit[j].joueurid)
                else this.query(`UPDATE deroulement SET mort = '3' WHERE partie = '${this.getLastGame()}' AND joueur = '${mortsnuit[j].joueurid}'`)
                
                // frères bianchis
                if(mortsnuit[j].roleid == 7) {
                    let otherbianchi = this.query(`SELECT J.discordid FROM deroulement D JOIN joueur J ON J.id = D.joueur WHERE role = '7' AND partie = '${this.getLastGame()}' AND mort = 0`)
                    if(otherbianchi.length > 0) {
                        for(k = 0; k < otherbianchi.length; k++) {
                            let bianchi = await this.client.users.fetch(otherbianchi[k].discordid)
                            let mafiosorand = this.query(`SELECT J.nom FROM deroulement D JOIN role R ON R.id = D.role JOIN joueur J ON J.id = D.joueur WHERE D.mort = '0' AND D.partie = '${this.getLastGame()}' AND R.camp = '1' ORDER BY RAND()`)
                            if(mafiosorand.length == 0) bianchi.send(this.embNotag("Bianchi", "Ton frère est mort. Cependant il ne retse plus aucun mafioso en vie.", "BLACK"))
                            else {
                                let pseudo = mafiosorand[0].nom.split('')
                                if(mafiosorand.length == 1) {
                                    let  shuffle = this.shuffleArray(this.shuffleArray(this.shuffleArray(pseudo)))
                                    bianchi.send(this.embNotag("Bianchi", `Ton frère est mort.\n\nVoici deux lettres composants le nom d'un mafioso : **${shuffle[0].toUpperCase()}**  /  **${shuffle[1].toUpperCase()}**`, "BLACK"))
                                }
                            }
                        }
                    }
                }
            
                // fils de la noche
                if(mortsnuit[j].roleid == 15) {
                    this.chansend.send("La lune est triste. La nuit prochaine les mafiosos ne pourront pas tuer quelqu'un")
                    this.query(`UPDATE infospartie SET filsdelune = 1 WHERE partie = '${this.getLastGame()}'`)
                }

                // dopple
                if(mortsnuit[j].joueurid == targetDoppel) {
                    let doppelid = this.query(`SELECT J.discordid FROM joueur J JOIN deroulement D ON J.id = D.joueur WHERE partie = '${this.getLastGame()}' AND D.role = '19'`)[0].discordid
                    let doppel = this.client.users.fetch(doppelid)
                    doppel.send(this.embNotag("Info", `Le joueur que tu avais ciblé vient de mourir. Tu voles donc son rôle : **${mortsnuit[j].rolenom}**`))
                    this.query(`UPDATE deroulement SET role = '${mortsnuit[j].roleid}', etat = '${mortsnuit[j].etat}' WHERE partie = '${this.getLastGame()}' AND role = '19'`)
                }
            }
    }
        await this.checkAngelos("J"+(this.cycle-1).toString())

        // remplacer par joueur.send après !
        
        let compo = this.getCompo()
        let alivetab = []
        for(i = 0; i < compo.length; i++) alivetab.push([compo[i].joueurid.toString(), compo[i].joueurnom])
        for(i = 0; i < compo.length; i++) {
            let joueur = await this.client.users.fetch(compo[i].discordid)
            switch(compo[i].roleid) {
                case 1:
                    let phrasesrand = this.shuffleArray(this.shuffleArray(this.shuffleArray(this.msgFouineur)))
                    let taille = phrasesrand.length
                    if(taille > 5) taille = 5
                    desc = "Voici 5 messages que les mafiosos on dit lors de cette nuit:\n\n"
                    for(k = 0; k < taille; k++) desc += `**·** ${phrasesrand[k]}\n`
                    joueur.send(this.embNotag("Fouineur", desc, "BLACK"))
                    break
                case 2:
                    if(this.cycle >=2 && this.cycle%2 == 0) {
                        let menus = this.createmenu(alivetab, "Séléctionnez un joueur à qui envoyer un message", "👉", "menumessager", 1)
                        if(menus.length == 1)  joueur.send("Action - Messager", menus[0])
                        else {
                            joueur.send("-", menus[0])
                            joueur.send("Action - Messager - suite", menus[1])
                        }
                    }
                    break
                case 3:
                    if(this.cycle >=2 && this.cycle%2 == 0) {
                        let menus = this.createmenu(alivetab, "Séléctionnez un joueur a espionner", "👉", "menuguerino", 1)
                        if(menus.length == 1)  joueur.send("Action - Guérino", menus[0])
                        else {
                            joueur.send("Action - Guérino", menus[0])
                            joueur.send("Action - Guérino - suite", menus[1])
                        }
                    }
                    break
                case 4:
                    // Angélos
                    let isMorts = this.query(`SELECT J.id AS joueurid, J.nom AS joueurnom FROM deroulement D JOIN joueur J ON J.id = D.joueur WHERE D.partie = '${this.getLastGame()}' AND D.mort = '2'`)
                    if(isMorts.length > 0) {
                        let tabmorts = []
                        for(i = 0; i < isMorts.length; i++) tabmorts.push([isMorts[i].joueurid.toString(), isMorts[i].joueurnom])
                        let menus = this.createmenu(tabmorts, "Séléctionnez un joueur à réssuciter", "👉", "menuangelos", 1)
                        if(menus.length == 1)  joueur.send("Vous pouvez choisir de réssuciter un joueur présent dans votre channel, une seule fois dans la partie", menus[0])
                        else {
                            joueur.send("Vous pouvez choisir de réssuciter un joueur présent dans votre channel, une seule fois dans la partie", menus[0])
                            joueur.send("- suite", menus[1])
                        }
                    }
                    break
                case 5:
                    console.log("5")
                    break
                case 6:
                    console.log("6")
                    break
                case 7:
                    console.log("7")
                    break
                case 8:
                    if(compo[i].nbuse > 0) {
                        let menus = this.createmenu(alivetab, "Séléctionnez un joueur a révéler (ce pouvoir n'est utilisable qu'une seule fois)", "👉", "menupacifiste", 1)
                        if(menus.length == 1)  joueur.send("Action - Guérino", menus[0])
                        else {
                            joueur.send("Séléctionnez un joueur a révéler (ce pouvoir n'est utilisable qu'une seule fois)", menus[0])
                            joueur.send(" - suite", menus[1])
                        }
                    }
                    break
                case 9:
                    console.log("9")
                    break
                case 10:
                    let menus = this.createmenu(alivetab, "Séléctionnez un joueur chez qui dormir cette nuit", "👉", "menusdf", 1)
                    if(menus.length == 1)  joueur.send("Action - SDF", menus[0])
                    else {
                        joueur.send("Action - SDF", menus[0])
                        joueur.send("Action - SDF - suite", menus[1])
                    }
                    break
                case 11:
                    console.log("11")
                    break
                case 12:
                    if(this.cycle >=2 && this.cycle%2 == 0) {
                        let query = this.query(`select J.nom FROM deroulement D JOIN joueur J ON J.id = D.joueur JOIN role R ON R.id = D.role WHERE R.camp = 1 AND partie = '${this.getLastGame()}' AND D.mort = '0'`)
                        if(query.length == 0) joueur.send(this.embNotag("Gino", "Il ne reste aucun mafioso en vie :(", "BLACK"))
                        else {
                            let pseudo = query[0].nom.split('')
                            if(query.length == 1) {
                                let  shuffle = this.shuffleArray(this.shuffleArray(this.shuffleArray(pseudo)))
                                joueur.send(this.embNotag("Gino", `Il ne reste qu'un mafioso en vie.\n\nVoici deux lettres composants son nom : **${shuffle[0].toUpperCase()}**  /  **${shuffle[1].toUpperCase()}**`, "BLACK"))
                            } else {
                                let shuffleobj = this.shuffleArray(this.shuffleArray(this.shuffleArray(query)))
                                desc = "Voici deux lettres composants le nom de deux mafiosos\n\n"
                                // premier pseudo
                                let pseudo = shuffleobj[0].nom.split('')
                                let  shuffle = this.shuffleArray(this.shuffleArray(this.shuffleArray(pseudo)))
                                desc += `**·** **${shuffle[0].toUpperCase()}**  /  **${shuffle[1].toUpperCase()}**`
                                // deuxieme pseudo
                                pseudo = shuffleobj[1].nom.split('')
                                shuffle = this.shuffleArray(this.shuffleArray(this.shuffleArray(pseudo)))
                                desc += `\n\n**·** **${shuffle[0].toUpperCase()}**  /  **${shuffle[1].toUpperCase()}**`
                            
                                joueur.send(this.embNotag("Gino", desc, "BLACK"))
                            }
                        }
                    }
                    break
                case 13:
                    console.log("13")
                    break
                case 14:
                    console.log("14")
                    break
                case 15:
                    console.log("15")
                    break
                case 16:
                    console.log("16")
                    break
                case 17:
                    console.log("17")
                    break
                case 18:
                    console.log("18")
                    break
                case 19:
                    console.log("19")
                    break
                case 20:
                    console.log("20")
                    break
                case 21:
                    console.log("21")
                    break
                case 22:
                    console.log("22")
                    break
                case 23:
                    console.log("23")
                    break
                case 24:
                    if(this.cycle >=2 && this.cycle%2 == 0) {
                        let nb = alivetab.length
                        if(nb > 5) nb = 5
                        let menus = this.createmenu(alivetab, `Séléctionnez ${nb} personnes à réveler`, "👉", "menurevelateur", nb)
                        if(menus.length == 1)  this.chansend.send(`Séléctionnez ${nb} joueurs. Vous saurez combien de mafiosos se cachent parmi eux`, menus[0])
                        else {
                            this.chansend.send(`Séléctionnez ${nb} joueurs. Vous saurez combien de mafiosos se cachent parmi eux`, menus[0])
                            this.chansend.send("suite", menus[1])
                        }
                }
                    break
                case 25:
                    console.log("25")
                    break
                case 26:
                    console.log("26")
                    break
                case 27:
                    console.log("27")
                    break
                case 28:
                    console.log("28")
                    break
                case 29:
                    console.log("29")
                    break
                case 30:
                    console.log("30")
                    break
                case 31:
                    console.log("31")
                    break
                case 32:
                    console.log("32")
                    break
                case 33:
                    console.log("33")
                    break
                case 34:
                    console.log("34")
                    break
                case 35:
                    console.log("35")
                    break
                case 36:
                    console.log("36")
                    break
                case 37:
                    console.log("37")
                    break
                case 38:
                    console.log("38")
                    break
                case 39:
                    console.log("39")
                    break
                case 40:
                    console.log("40")
                    break
                case 41:
                    console.log("qa")
                    break
                case 42:
                    console.log("qd")
                    break
                case 43:
                    console.log("43")
                    break
                case 44:
                    console.log("44")
                    break
                case 45:
                    console.log("45")
                    break
                case 46:
                    console.log("46")
                    break
            }
        }

        setTimeout(() => {
            let infos = this.getInfospartie()
            if(infos.pacifiste == 1) {
                this.nuit()
                this.query(`UPDATE infospartie SET pacifiste = 2 WHERE partie = '${this.getLastGame()}'`)
            } else {
                this.vote()
            }
        }, 8000);
    },

    vote: async function() {
        console.log(`Vote ${this.cycle}`)
        this.chansend.send(`<@&${configA.rolejoueur}> C'est l'heure du vote ! Vous allez recevoir un message pour choisir un joueur à éliminer`)

        let alive = this.getCompo()
        let alivetab = []
        this.tabVotesJour = {}
        for(i = 0; i < alive.length; i++) {
            alivetab.push([alive[i].joueurid.toString(), alive[i].joueurnom])
            this.tabVotesJour[alive[i].joueurid.toString()] =[alive[i].joueurnom, 0]
        }

        let menusvote = this.createmenu(alivetab, "Votez un joueur pour l'éliminer", "👉", "menuvotejour", 1)

        for(i = 0; i < alive.length; i++) {
            let joueur = await this.client.users.fetch(alive[i].discordid)
            
            if(menusvote.length == 1)  this.chansend.send(`Choisissez un joueur à voter (votre vote compte pour **${alive[i].vote}**)`, menusvote[0])
            else {
                joueur.send(`Vote de la journée (votre vote compte pour **${alive[i].vote}**)`, menusvote[0])
                joueur.send(`Vote de la journée - Suite`, menusvote[1])
            }
            
        }

        // Affichage embed votes
        let desc = ''
        for (const [key, value] of Object.entries(this.tabVotesJour)) desc += `**·** ${value[0]} -> **${value[1]}** votes\n\n`
        let embedvotes = this.embNotag("VOTES", desc, "BLACK")

        let embedSend = await this.chansend.send(embedvotes)

        let intervalvote = setInterval(() => {
            desc = ''
            for (const [key, value] of Object.entries(this.tabVotesJour)) desc += `**·** ${value[0]} -> **${value[1]}** votes\n\n`
            embedSend.edit(embed.setDescription(desc))
        }, 3000);

        // Changer timer/fonction appellée si chateleain dans la compo
        setTimeout(() => {
            clearInterval(intervalvote)
            // CHECK EGALITE + SI IDV
            if(this.resultatsVJour()[1] == "Egalité") {
                this.chansend.send("Il y a égalité sur le vote, personne ne meurt ce jour !")
                this.nuit()
            } else {
                let query = this.query(`SELECT J.discordid, E.nbuse FROM deroulement D JOIN joueur J ON J.id = D.joueur JOIN partie P ON P.id = D.partie JOIN role R ON R.id = D.role JOIN etat E ON E.id = D.etat WHERE mort = 0 AND D.partie = '${this.getLastGame()}' AND role = '13'`)
                if(!query.length) {
                    this.mortJour()
                    this.nuit() 
                }
                else {
                    if(query[0].nbuse == 1) this.chatelain()
                    else {
                        this.mortJour()
                        this.nuit() 
                    }  
                }
            
            }
        }, 8000);
    },


    chatelain: async function() {
        console.log(`Tour châtelain ${this.cycle}`)
        this.chansend.send("Le châtelain décide s'il veut grâcier le condamné ou non")
        let resultats = this.resultatsVJour()
        let ressucite = 0
        
        let msgSend = await this.chansend.send(this.embNotag("Annuler le voter", `La personne la plus votée ce jour est **${resultats[1]}**\n\n Si tu souhaites annuler le vote et le grâcier, ajoute ✅`, "BLACK"))
        msgSend.react("✅")
        const filter = () => true
        const collector = msgSend.createReactionCollector(filter)
            collector.on('collect', (reaction, user) => {
                if(reaction.emoji.name === '✅' && !user.bot) {
                    this.chansend.send("Le châtelain a décidé d'épargner la victime du vote de cette journée !")
                    this.query(`UPDATE deroulement D JOIN etat E ON E.id = D.etat SET nbuse = 0 WHERE role = '13' AND partie = '${this.getLastGame()}'`)
                    ressucite = 1
                }
            })

        setTimeout(() => {
            msgSend.delete()
            if(ressucite == 0) this.mortJour()
            this.nuit()
        }, 8000);
    },


    nuit: async function() {
        console.log(`Nuit ${this.cycle}`)
        await this.checkAngelos("N"+(this.cycle-1).toString())

        this.chanMafiosos.send(this.embNotag("Info", `C'est la nuit, vous avez 15 minutes pour voter et parler entre vous.\n\nAttention, s'il y a un Fouineur dans la partie il pourra voir certains de vos message`, "BLACK"))
        
        // Collector pour fouineur
        this.msgFouineur = []
        const filter = () => true
        const collector = this.chanMafiosos.createMessageCollector(filter);
        collector.on('collect', (msg) => {
            if(!msg.author.bot) this.msgFouineur.push(msg.content)
        });
        
        // actions roles nocturnes
        let compo = this.getCompo()
        let alivetab = []
        for(i = 0; i < compo.length; i++) alivetab.push([compo[i].joueurid.toString(), compo[i].joueurnom])
        for(i = 0; i < compo.length; i++) {
            let joueur = await this.client.users.fetch(compo[i].discordid)
            switch(compo[i].roleid) {
                case 4:
                    // Angélos
                    if(compo[i].nbuse > 0) {
                        let isMorts = this.query(`SELECT J.id AS joueurid, J.nom AS joueurnom FROM deroulement D JOIN joueur J ON J.id = D.joueur WHERE D.partie = '${this.getLastGame()}' AND D.mort = '2'`)
                        if(isMorts.length > 0) {
                            let tabmorts = []
                            for(i = 0; i < isMorts.length; i++) tabmorts.push([isMorts[i].joueurid.toString(), isMorts[i].joueurnom])
                            let menus = this.createmenu(tabmorts, "Séléctionnez un joueur à réssuciter", "👉", "menuangelos", 1)
                            if(menus.length == 1)  joueur.send("Vous pouvez choisir de réssuciter un joueur présent dans votre channel, une seule fois dans la partie", menus[0])
                            else {
                                joueur.send("Vous pouvez choisir de réssuciter un joueur présent dans votre channel, une seule fois dans la partie", menus[0])
                                joueur.send("- suite", menus[1])
                            }
                        }
                }
                    break
                case 5:
                    console.log("5")
                    break
                case 6:
                    if(this.cycle >= 2) {
                        if(compo[i].choixbouffon == "intelligent" && compo[i].nbuse > 0) { 
                            let menus = this.createmenu(alivetab, "Séléctionnez un joueur a regarder", "👉", "menubouffon", 1)
                            if(menus.length == 1)  joueur.send("Action - Bouffon (Vous n'êtes pas obligé d'utiliser ce pouvoir)", menus[0])
                            else {
                                joueur.send("Action - Bouffon (Vous n'êtes pas obligé d'utiliser ce pouvoir)", menus[0])
                                joueur.send("Action - Bouffon - suite", menus[1])
                            }

                        }
                    }
                    break
                case 7:
                    console.log("7")
                    break
                case 8:
                    console.log("8")
                    break
                case 9:
                    console.log("9")
                    break
                case 11:
                    console.log("11")
                    break
                case 13:
                    console.log("13")
                    break
                case 14:
                    if(this.getInfospartie().dernierluc == 0) {
                        let hasLucciano = this.query(`SELECT J.nom FROM deroulement D JOIN joueur J ON J.id = D.joueur WHERE D.role = 42 AND partie = '${this.getLastGame()}' AND D.mort = '0'`)
                        if(hasLucciano.length == 0) {
                            this.query(`UPDATE infospartie SET dernierluc = 1 WHERE partie = '${this.getLastGame()}'`)
                            joueur.send(this.embNotag("Info", `Il ne reste plus de Luciano en vie, tu rejoins désormais le camps des Mafiosos.`, "RED"))
                            this.chanMafiosos.updateOverwrite(joueur, { VIEW_CHANNEL: true });
                        }
                    }
                    break
                case 15:
                    console.log("15")
                    break
                case 16:
                    console.log("16")
                    break
                case 17:
                    console.log("17")
                    break
                case 18:
                    console.log("18")
                    break
                case 19:
                    console.log("19")
                    break
                case 20:
                    console.log("20")
                    break
                case 21:
                    console.log("21")
                    break
                case 22:
                    console.log("22")
                    break
                case 23:
                    console.log("23")
                    break
                case 25:
                    console.log("25")
                    break
                case 26:
                    console.log("26")
                    break
                case 27:
                    if(this.nbUse(27) > 0) {
                        let menus = this.createmenu(alivetab, "Séléctionnez un joueur à emmerder", "👉", "menusalegamin", 1)
                        if(menus.length == 1)  joueur.send("Choisissez une personne à aller emmerder cette nuit. Il ne pourra pas voter au matin\n\nVous n'êtes pas obligé d'utiliser votre pouvoir maintenant", menus[0])
                        else {
                            joueur.send("Choisissez une personne à aller emmerder cette nuit. Il ne pourra pas voter au matin\n\nVous n'êtes pas obligé d'utiliser votre pouvoir maintenant", menus[0])
                            joueur.send(" - suite", menus[1])
                        }
                    }
                    break
                case 28:
                    if(this.nbUse(28) > 0) {
                        let menus = this.createmenu(alivetab, "Séléctionnez un joueur à aider", "👉", "menugentilgamin", 1)
                        if(menus.length == 1)  joueur.send("Choisissez une personne à aller aider cette nuit. Son vote comptera double au matin\n\nVous n'êtes pas obligé d'utiliser votre pouvoir maintenant.", menus[0])
                        else {
                            joueur.send("Choisissez une personne à aller aider cette nuit. Son vote comptera double au matin\n\nVous n'êtes pas obligé d'utiliser votre pouvoir maintenant.", menus[0])
                            joueur.send(" - suite", menus[1])
                        }
                    }
                    break
                case 29:
                    console.log("29")
                    break
                case 30:
                    console.log("30")
                    break
                case 31:
                    console.log("31")
                    break
                case 32:
                    if(this.cycle >=2 && this.cycle%2 == 0) {
                        let menus = this.createmenu(alivetab, "Séléctionnez un joueur a espionner", "👉", "menushaman", 1)
                        if(menus.length == 1)  joueur.send("Action - Mafioso Shaman", menus[0])
                        else {
                            joueur.send("Action - Mafioso Shaman", menus[0])
                            joueur.send("Action - Mafioso Shaman - suite", menus[1])
                        }
                    }
                    break
                case 33:
                    console.log("33")
                    break
                case 34:
                    console.log("34")
                    break
                case 35:
                    console.log("35")
                    break
                case 36:
                    console.log("36")
                    break
                case 37:
                    console.log("37")
                    break
                case 38:
                    console.log("38")
                    break
                case 39:
                    console.log("39")
                    break
                case 40:
                    console.log("40")
                    break
                case 41:
                    console.log("qa")
                    break
                case 42:
                    console.log("qd")
                    break
                case 43:
                    console.log("43")
                    break
                case 44:
                    console.log("44")
                    break
                case 45:
                    console.log("45")
                    break
                case 46:
                    console.log("46")
                    break
            }
        }

        // Vote mafiosos
        let islunetriste = this.getInfospartie().filsdelune
        let intervalvote = null
        if(islunetriste == 1) {
            this.query(`UPDATE infospartie SET filsdelune = 2 WHERE partie = '${this.getLastGame()}'`)
        } else {
            let mafiosos = this.query(`SELECT discordid FROM deroulement D JOIN joueur J ON J.id = D.joueur JOIN role R ON R.id = D.role WHERE R.camp = '1' AND partie = '2' AND mort = '0'`)
            let nonmafiosos = this.query(`SELECT J.id AS joueurid, J.nom AS joueurnom FROM deroulement D JOIN joueur J ON J.id = D.joueur JOIN role R ON R.id = D.role WHERE R.camp != '1' AND partie = '2' AND mort = '0'`)
            this.tabVotesMafiosos = {}

            let choixvote = []
            for(i = 0; i < nonmafiosos.length; i++) {
                choixvote.push([nonmafiosos[i].joueurid.toString(), nonmafiosos[i].joueurnom])
                this.tabVotesMafiosos[nonmafiosos[i].joueurid.toString()] =[nonmafiosos[i].joueurnom, 0]
            }

            let menusvote = this.createmenu(choixvote, "Votez un joueur pour l'éliminer", "👉", "menuvotemafiosos", 1)
            for(i = 0; i < mafiosos.length; i++) {
                let joueur = await this.client.users.fetch(mafiosos[i].discordid)
                
                if(menusvote.length == 1)  this.chansend.send(`Vote Mafiosos - Choisissez un joueur à éliminer (Votre vote peut compter différement selon votre rôle)`, menusvote[0])
                else {
                    joueur.send(`Vote Mafiosos - Choisissez un joueur à éliminer (Votre vote peut compter différement selon votre rôle)`, menusvote[0])
                    joueur.send(`Vote Mafiosos - Suite`, menusvote[1])
                }
            }

            let desc = ''
            for (const [key, value] of Object.entries(this.tabVotesMafiosos)) desc += `**·** ${value[0]} -> **${value[1]}** votes\n\n`
            let embedvotes = this.embNotag("VOTES", desc, "BLACK")

            let embedSend = await this.chanMafiosos.send(embedvotes)
        
            intervalvote = setInterval(() => {
                desc = ''
                for (const [key, value] of Object.entries(this.tabVotesMafiosos)) desc += `**·** ${value[0]} -> **${value[1]}** votes\n\n`
                embedSend.edit(embed.setDescription(desc))
            }, 3000);
        }
        
        setTimeout(() => {
            if(islunetriste != 1) {
                clearInterval(intervalvote)
                collector.stop()
                this.query(`UPDATE deroulement SET mort = 1 WHERE joueur = '${this.resultatsVMafiosos()[2]}' AND partie = '${this.getLastGame()}'`)
            }
            this.deliberation()
            /*
            this.cycle ++
            await this.mortMafiosos()
            this.jour()*/
        }, 8000);
    },

    isProtected: function(joueur) {
        let protege = false
        let role = this.query(`SELECT D.role, E.choixbouffon, E.nbuse, E.target, R.camp FROM deroulement D JOIN etat E ON E.id = D.etat JOIN role R ON R.id = D.role WHERE D.partie = '${this.getLastGame()}' AND D.joueur = '${joueur}'`)[0]
        // Bouffon
        if(role.role == '6') {
            if(role.choixbouffon == "fort" && role.nbuse > 0) {
                protege = true
               this.query(`UPDATE etat E JOIN deroulement D ON E.id = D.etat SET E.nbuse = E.nbuse -1 WHERE D.joueur = '${joueur}' AND D.partie = '${this.getLastGame()}'`) 
            }
        }
        // SDF
        if(role.role == '10') {
            if(role.target != joueur) protege = true
        }
        // Garde
        let garde = this.query(`SELECT E.target FROM deroulement D JOIN etat E ON E.id = D.etat WHERE D.partie = '${this.getLastGame()}' AND D.role = '26' AND mort = '0'`)
        if(garde.length > 0) {
            if(garde[0].target == joueur) protege = true
        }

        // Solo 
        if(role.camp == '2') protege = true

        if(protege == true) this.query(`UPDATE deroulement SET mort = 0 WHERE joueur = '${joueur}' AND partie = '${this.getLastGame()}'`)
        return protege
    },

    deliberation: async function() {
        console.log("Delib")
        if(this.resultatsVMafiosos()[2] == 0) {
            console.log("égalité")
        }
        else {
            // check si la personne est protégé + update db si oui
            let protege = this.isProtected(this.resultatsVMafiosos()[2])
            let hasChirurgien = this.query(`SELECT J.discordid, E.chisave FROM deroulement D JOIN joueur J ON J.id = D.joueur JOIN etat E ON E.id = D.etat WHERE D.partie = '${this.getLastGame()}' AND D.role = '9' AND mort = '0'`)
            // S'il y a un chirurgien dans la compo :      
            if(hasChirurgien.length > 0) {
                let chirurgien = await this.client.users.fetch(hasChirurgien[0].discordid)
                // Tout le temps : envoie le mort s'il est protégé
                if(protege == true) {
                    let leprotege = this.query(`SELECT nom FROM joueur WHERE id = '${this.resultatsVMafiosos()[2]}'`)
                    chirurgien.send(this.embNotag("Cible Mafiosos", `**${leprotege}** a été attaqué par les mafiosos cette nuit mais n'est pas mort.`, "BLACK"))
                }

            // Si encore save : propose
            if(hasChirurgien[0].chisave == "1") {
                
                let msgSend = await chirurgien.send(this.embNotag("Sauver la personne", `Une personne a été attaquée par les mafiosos cette nuit\n\n Si tu souhaites la sauver, ajoute ✅`, "ORANGE"))
                msgSend.react("✅")
                const filter = () => true
                const collector = msgSend.createReactionCollector(filter)
                    collector.on('collect', (reaction, user) => {
                        if(reaction.emoji.name === '✅' && !user.bot) {
                            chirurgien.send(this.embNotag("Tu as bien guérit la personne !"))
                            // Enlève nbuse + mort = 0
                            this.query(`UPDATE etat E JOIN deroulement D ON E.id = D.etat SET E.chisave = '0' WHERE D.role = '9' AND D.partie = '${this.getLastGame()}'`)
                            this.query(`UPDATE deroulement SET mort = 0 WHERE joueur = '${this.resultatsVMafiosos()[2]}' AND partie = '${this.getLastGame()}'`)
                        }
                    })
                }
            // Si encore poison : propose
            if(hasChirurgien[0].chipoison == "1") {
                let compo = this.getCompo()
                let alivetab = []
                for(i = 0; i < compo.length; i++) alivetab.push([compo[i].joueurid.toString(), compo[i].joueurnom])
                
                let menus = this.createmenu(alivetab, "Séléctionnez un joueur à empoisonner", "👉", "menuchirurgien", 1)
                if(menus.length == 1)  joueur.send("Action - Chirurgien", menus[0])
                else {
                    joueur.send("Séléctionnez un joueur à tuer **si vous le souhaitez**", menus[0])
                    joueur.send("Séléctionnez un joueur à tuer **si vous le souhaitez** - suite", menus[1])
                }
            }
        }
    }

        // Tueur mafioso
        if(this.cycle >=3 && this.cycle%3 == 0) {
            let hasTueur = this.query(`SELECT J.discordid FROM deroulement D JOIN joueur J ON J.id = D.joueur WHERE D.partie = '${this.getLastGame()}' AND D.role = '33' AND mort = '0'`)
            if(hasTueur.length > 0) {
                let joueur = await this.client.users.fetch(hasTueur[0].discordid)
                
                let mafiosos = this.query(`SELECT discordid FROM deroulement D JOIN joueur J ON J.id = D.joueur JOIN role R ON R.id = D.role WHERE R.camp = '1' AND partie = '2' AND mort = '0'`)
                let choixvote = []
                for(i = 0; i < let.length; i++) choixvote.push([mafiosos[i].joueurid.toString(), mafiosos[i].joueurnom])

                let menusvote = this.createmenu(choixvote, "Séléctionnez un mafioso à tuer", "👉", "menutueurmafioso", 1)
                if(menusvote.length == 1)  this.chansend.send(`Choisissez un joueur à tuer si vous le souhaitez`, menusvote[0])
                else {
                    joueur.send(`Choisissez un joueur à tuer si vous le souhaitez`, menusvote[0])
                    joueur.send(` - Suite`, menusvote[1])
                }
            }
        }

        setTimeout(() => {
            this.cycle ++
            this.jour()
        }, 8000);
    },

    messager: async function(messager, target) {
        messager.send(this.embNotag("Messager", "Envoyez maintenant le message que vous souhaitez enovoyer au joueur (évitez tout indice concernant votre identité !)", "BLACK"))
        const filter = () => true
        const collector = messager.createMessageCollector(filter, {max: 100});
        collector.on('collect', (msg) => {
            if(!msg.author.bot) {
            let msgcontent = msg.content
            collector.stop()

            let query = this.query(`SELECT discordid, nom FROM joueur WHERE id = '${target[0]}'`)
            let joueur = this.client.users.fetch(query[0].discordid)
            joueur.then((joueur) => {
                joueur.send(this.embNotag("Information du messager", `Le messager a décidé de communiquer avec vous ! Voici son message : \n\n${msgcontent}`, "BLACK"))
            })
        }
            
        });

    },

    guerino: function(joueur, target) {
        let query = this.query(`SELECT R.nom, J.nom AS nomjoueur FROM deroulement D JOIN role R ON R.id = D.role JOIN joueur J ON J.id = D.joueur WHERE J.id = '${target}' AND D.partie = '${this.getLastGame()}'`)
        if(query) {
            joueur.send(this.embNotag("Rôle espionné", `Tu as espionné le rôle de ${query[0].nomjoueur}, il est **${query[0].nom}**`))
        } else return joueur.send("soucis, faut contacter le dev :(")
    },
    
    shaman: function(joueur, target) {
        let query = this.query(`SELECT R.nom, J.nom AS nomjoueur FROM deroulement D JOIN role R ON R.id = D.role JOIN joueur J ON J.id = D.joueur WHERE J.id = '${target}' AND D.partie = '${this.getLastGame()}'`)
        if(query) {
            joueur.send(this.embNotag("Rôle espionné", `Tu as espionné le rôle de ${query[0].nomjoueur}, il est **${query[0].nom}**`))
        } else return joueur.send("soucis, faut contacter le dev :(")
    },

    sdf: function(joueur, target) {
        let query = this.query(`SELECT discordid, nom FROM joueur WHERE id = '${target[0]}'`)
        if(query) {
            let targ = this.client.users.fetch(query[0].discordid)
            targ.then((targ) => {
                joueur.send(this.embNotag("Confirmé", `Vous dormirez chez ${query[0].nom} cette nuit.`, "BLACK"))
                targ.send(this.embNotag("Visite", "Le SDF vient dormir chez vous cette nuit.", "BLACK"))

                this.query(`UPDATE deroulement D JOIN etat E ON E.id = D.etat SET target = '${target[0]}' WHERE partie = '${this.getLastGame()}' AND role = '10'`)
            })
        } else return targ.send("soucis, faut contacter le dev :(")
    },

    revelateur: function(joueur, target) {
        let check = `SELECT * FROM deroulement D JOIN role R ON R.id = D.role WHERE mort = 0 AND D.${this.getLastGame()}' AND camp = 1 AND (joueur = '${target[0]}'`
        for(i = 1; i < target.length; i++) check += ` OR joueur = '${target[i]}'`
        check += ")"
        joueur.send(this.embNotag("Résultats", `Parmi les personnes que vous avez séléctionnés se trouvent ${this.query(check).length} mafioso(s).`, "BLACK"))
    },

    angelos: async function(menu) {
        if(menu.values.length == 0) return
        let rez = menu.values[0]
        let quer = this.query(`SELECT discordid FROM joueur WHERE id = ${rez}`)[0].discordid
        let joueur = await this.client.users.fetch(quer)
        this.query(`UPDATE deroulement SET mort = 0 WHERE joueur = '${rez}' AND partie = '${this.getLastGame()}'`)
        this.query(`UPDATE etat E JOIN deroulement D ON E.id = D.etat SET E.nbuse = '0' WHERE D.role = '4' AND D.partie = '${this.getLastGame()}'`)
        joueur.send(this.embNotag("Résurrection", `Vous venez d'être réssucité par Angélos ! Vous revenez dans la partie`, "GREEN"))
    },

    gentilGamin: async function(menu) {
        if(menu.values.length == 0) return
        let target = menu.values[0]
        let quer = this.query(`SELECT discordid FROM joueur WHERE id = ${target}`)[0].discordid
        let joueur = await this.client.users.fetch(quer)
        joueur.send(this.embNotag("Gentil gamin", `Le Gentil Gamin a décidé de vous jouer une douce mélodie cette nuit! Votre vote comptera double lors du prochain jour!`, "GREEN"))
        this.infosJour.push(`Le Gentil Gamin a décidé de jouer de la musique à **${joueur}** cette nuit!`)
        this.query(`UPDATE deroulement SET vote = '2' WHERE joueur = '${target}' AND partie = '${this.getLastGame()}'`)
        this.query(`UPDATE deroulement D JOIN etat E ON E.id = D.etat SET nbuse = nbuse -1 WHERE role = '28' AND partie = '${this.getLastGame()}' `)
    },

    saleGamin: async function(menu) {
        if(menu.values.length == 0) return
        let target = menu.values[0]
        let quer = this.query(`SELECT discordid FROM joueur WHERE id = ${target}`)[0].discordid
        let joueur = await this.client.users.fetch(quer)
        joueur.send(this.embNotag("Sale gamin", `Le Sale Gamin a décidé de bien vous emmerdez lors de cette nuit, vous empêchant d'être lucide et de voter le jour prochain!`, "RED"))
        this.infosJour.push(`  Le Sale Gamin a décidé d'emmerder **${joueur}** cette nuit!`)
        this.query(`UPDATE deroulement SET vote = 0 WHERE joueur = '${target}' AND partie = '${this.getLastGame()}'`)
        this.query(`UPDATE deroulement D JOIN etat E ON E.id = D.etat SET nbuse = nbuse -1 WHERE role = '27' AND partie = '${this.getLastGame()}' `)
    },

    chirurgienKill: function(menu) {
        if(menu.values.length == 0) return

        let garde = this.query(`SELECT E.target FROM deroulement D JOIN etat E ON E.id = D.etat WHERE D.partie = '${this.getLastGame()}' AND D.role = '26' AND mort = '0'`)
        if(garde.length > 0) {
            if(garde[0].target != menu.values[0]) this.query(`UPDATE deroulement SET mort = 1 WHERE joueur = '${menu.values[0]}' AND partie = '${this.getLastGame()}'`)
        }
        this.query(`UPDATE etat E JOIN deroulement D ON E.id = D.etat SET E.chipoison = '0' WHERE D.role = '9' AND D.partie = '${this.getLastGame()}'`)
    },

    tueurMafioso: function(menu) {
        if(menu.values.length == 0) return
        let protege = this.isProtected(menu.values[0])
        if(protege == true) return
        else this.query(`UPDATE deroulement SET mort = 1 WHERE joueur = '${menu.values[0]}'`)

    },

    bouffonint: function(menu) {
        if(menu.values.length == 0) return
        let target = menu.values[0]
        let compo = this.getCompo()
        let camp = 0
        let giveRandom = false
        let giveCamp = false
        tabRoles = []

        shuffled = this.shuffleArray(this.shuffleArray(this.shuffleArray(compo)))
        for(j = 0; j < shuffled.length; j++) {
            if(shuffled[j].joueurid == target) {
                camp = shuffled[j].camp
                tabRoles.push(shuffled[j].rolenom)
                shuffled.splice(j, 1)
            } 
        }

        for(j = 0; j < shuffled.length; j++) {
            if(shuffled[j].camp != camp) {
                if(!giveCamp) {
                    giveCamp = true
                    tabRoles.push(shuffled[j].rolenom)
                } else {
                    if(!giveRandom) {
                        giveRandom = true
                        tabRoles.push(shuffled[j].rolenom)
                    }
                }
            } 
            else {
                if(!giveRandom) {
                    giveRandom = true
                    tabRoles.push(shuffled[j].rolenom)
                }
            }
        }
        let tabrandomise = this.shuffleArray(this.shuffleArray(this.shuffleArray(this.shuffleArray(tabRoles))))

        menu.clicker.user.send(this.embNotag("Résultat", `Le rôle de la personne choisit se trouve entre les suivants : \n\n${tabrandomise.join(" - ")}`))
    },

    pacifiste: function(menu) {
        this.query(`UPDATE deroulement D JOIN etat E ON E.id = D.etat SET E.nbuse = '0' WHERE D.partie = '${this.getLastGame()}' AND D.role = '8'`)
        this.query(`UPDATE infospartie SET pacifiste = 1 WHERE partie = '${this.getLastGame()}'`)
        
        let target = menu.values[0]
        let querytarget = this.query(`SELECT J.nom AS joueurnom, R.nom AS rolenom FROM deroulement D JOIN joueur J ON J.id = D.joueur JOIN role R ON R.id = D.role WHERE partie = '${this.getLastGame()}' AND J.id = '${target}'`)
        this.chansend.send(this.embNotag("Pacifiste", `Le pacifiste a décidé de dévoiler **${querytarget[0].joueurnom}** qui est **${querytarget[0].rolenom}** !\nLe vote de ce jour est par conséquent annulé`))
    },

    doppel: function(menu) {
        let target = menu.values[0]
        this.query(`UPDATE deroulement D JOIN etat E ON E.id = D.etat SET target = '${target}' WHERE partie = '${this.getLastGame()}' AND role = '19'`)
    },

    // FIN FONCTIONS ROLES !

    votejour: function(menu) {
        menu.message.delete()
        let nbvote = this.query(`SELECT vote FROM deroulement D JOIN joueur J ON J.id = D.joueur WHERE partie = '${this.getLastGame()}' AND J.discordid = '${menu.clicker.id}'`)[0].vote
        this.tabVotesJour[menu.values[0].toString()][1] += nbvote

    },

    voteMafiosos: function(menu) {
        menu.message.delete()
        let role = this.query(`SELECT role FROM deroulement D JOIN joueur J ON J.id = D.joueur WHERE D.partie = '${this.getLastGame()}' AND J.discordid = '${menu.clicker.id}'`)[0].role
        nbvote = 1
        if(role == '38') nbvote = 0
        if(role == '41') nbvote = 2
        this.tabVotesMafiosos[menu.values[0].toString()][1] += nbvote

    },

    client: "rien",

    setClient: function(client) {
        this.client = client
        this.chansend = client.guilds.cache.get(configA.guild).channels.cache.get(configA.chanAnnonces)
        this.chanMafiosos = client.guilds.cache.get(configA.guild).channels.cache.get(configA.chanMafiosos)
    },

    embedCompo : "rien",

    setEmbedcompo: function(nv) {
        this.embedCompo = nv
    },

    tabVotesJour: {},
    tabVotesMafiosos: {},

    resultatsVJour : function() {

        let pseudomax = "Personne"
        let votesmax = 0
        clemax = 0
        
        for (const [key, value] of Object.entries(this.tabVotesJour)) {

            if(parseInt(value[1]) == votesmax) {
                pseudomax = "Egalité"
            }


            if(parseInt(value[1]) > votesmax) {
                votesmax = parseInt(value[1])
                pseudomax = value[0]
                clemax = key
            }
        }
        return [votesmax, pseudomax, clemax] 

    },

    resultatsVMafiosos : function() {

        let pseudomax = "Personne"
        let votesmax = 0
        clemax = 0
        
        for (const [key, value] of Object.entries(this.tabVotesMafiosos)) {

            if(parseInt(value[1]) == votesmax) {
                pseudomax = "Egalité"
            }


            if(parseInt(value[1]) > votesmax) {
                votesmax = parseInt(value[1])
                pseudomax = value[0]
                clemax = key
            }
        }
        return [votesmax, pseudomax, clemax] 

    },

    mortJour: function() {
        // annonce la mort + modifie db + si angelo fait les bails // check idv
        let resultats = this.resultatsVJour()
        // 0 = nb votes / 1 = pseudo / 2 = id
        let isidv = this.query(`SELECT role FROM deroulement WHERE partie = '${this.getLastGame()}' AND joueur = '${resultats[2]}'`)[0].role
        if(isidv == 22) {
            this.chansend.send(`La personne la plus votée est **${resultats[1]}** qui est Idiot du village.\nIl reste donc en vie pendant les deux prochains jours.`)
            this.query(`UPDATE infospartie SET mortidv = '${this.cycle}' WHERE partie = '${this.getLastGame()}'`)
        } else {
            let role = this.getRoleById(resultats[2])
            this.chansend.send(`**${resultats[1]}** est le joueur le plus voté, il était **${role[0].nom}** !`)
            // gérer mort
            let hasAngelo = this.query(`SELECT J.discordid FROM deroulement D JOIN joueur J ON J.id = D.joueur WHERE mort = 0 AND D.partie = '${this.getLastGame()}' AND role = '4'`)
            if(hasAngelo.length > 0) this.mortAngelos(resultats[2])
            else this.query(`UPDATE deroulement SET mort = '3' WHERE partie = '${this.getLastGame()}' AND joueur = '${resultats[2]}'`)
            
        }
    },

    mortMafiosos: async function() {
        // check TOUT les trucs chiant de guérison 
        // TODO : settimeout : update db mort 1 puid delib() avec tueur mafioso sorciere etc
        let resultats = this.resultatsVMafiosos()
        
    },

    mortAngelos: async function(joueurid) {
        let quer = this.query(`SELECT discordid FROM joueur WHERE id = ${joueurid}`)[0].discordid
        let joueur = await this.client.users.fetch(quer)
        let chan = this.client.guilds.cache.get(configA.guild).channels.cache.get(configA.chanAngelos)
        chan.updateOverwrite(joueur, { VIEW_CHANNEL: true });
        joueur.send(this.embNotag("Mort", `Tu es mort mais ton aventure n'est pas terminée..\n\nTu as désormais accès à <#${configA.chanAngelos}>, Angélos pourra peut-être te réssuciter`, "RED"))
        this.query(`UPDATE deroulement SET mort = '2', timingMort = 'J${this.cycle.toString()}' WHERE partie = '${this.getLastGame()}' AND joueur = '${this.resultatsVJour()[2]}'`)
    },

    checkAngelos: async function(string) {
        //console.log(`SELECT * FROM deroulement D JOIN joueur J ON J.id = D.joueur WHERE partie = '${this.getLastGame()}' AND mort = '2' AND timingMort = '${string}'`)
        let result = this.query(`SELECT J.discordid, D.joueur FROM deroulement D JOIN joueur J ON J.id = D.joueur WHERE partie = '${this.getLastGame()}' AND mort = '2' AND timingMort = '${string}'`)
        if(result.length > 0) {
            for(i = 0; i < result.length; i++) {
                let joueur = await this.client.users.fetch(result[i].discordid)
                let chan = this.client.guilds.cache.get(configA.guild).channels.cache.get(configA.chanAngelos)
                chan.updateOverwrite(joueur, { VIEW_CHANNEL: false });
                joueur.send(this.embNotag("Mort", "Tu es définitivement mort.", "RED"))
                // Add role spec
                this.query(`UPDATE deroulement SET mort = 3 WHERE joueur = ${result[i].joueur}`)
            }
        }
    },
    

    chansend : "nope",
    chanMafiosos: "nope",

    cycle: 1,

    infosJour: [],

    msgFouineur: [],

    name: "fonction"

}