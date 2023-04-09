const mysql = require('mysql')
const config = require('./config.json')
const db = mysql.createConnection({

    host: "localhost",
    user: "root",
    password: config.mdp,
    database : "mafia"
 
  });
  db.connect(function(err) {
    if (err) throw err;

});

module.exports = db