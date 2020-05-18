const { Pool } = require('pg')

function initDb() {
    var uri = process.env.DATABASE_URL.replace('postgres://','')
    var user = uri.split(':')[0]
    uri = uri.split(':')[1]+':'+uri.split(':')[2]
    var pass = uri.split('@')[0]
    uri = uri.split('@')[1]
    var host = uri.split(':')[0]
    uri = uri.split(':')[1]
    var port = parseInt(uri.split('/')[0])
    var db = uri.split('/')[1]

    var pool = new Pool({
      user: user,
      host: host,
      password: pass,
      database: db,
      port: port
    })

    pool.query(
     `CREATE TABLE IF NOT EXISTS trails (
         guid  int,
         name varchar(45),
         description varchar(1000),
         geohash varchar(45),
         image varchar(100),
         pass varchar(256),
         PRIMARY KEY(guid)
     )
    `, [], (err, result) => {})

    pool.query(
     `CREATE TABLE IF NOT EXISTS points (
         guid  int,
         name varchar(45),
         description varchar(1000),
         trail int REFERENCES trails(guid),
         geohash varchar(45),
         image varchar(100),
         PRIMARY KEY(guid)
     )
    `, [], (err, result) => {})

    return pool
}

module.exports = {initDb: initDb}
