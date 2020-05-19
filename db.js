const { Pool } = require('pg')
const crypto = require('crypto');

function guid(){
  return Math.floor(Math.random() * (2**32 - 1))
}

function secureHash(string){
  var sha256 = crypto.createHash('sha256')
  sha256.update(string)
  return sha256.digest("hex")
}

function whereStr(constr, rules) {
  var where = []
  var vals = []
  var i = 1;
  for (con in constr) {
    if (rules[con] === "exact") {
      where.push(`${con} = $${i}`)
      vals.push(constr[con])
    }
    if (rules[con] === "prefix") {
      where.push(`${con} LIKE $${i}`)
      vals.push(constr[con]+'%')
    }
    if (rules[con] === "substr") {
      where.push(`${con} LIKE $${i}`)
      vals.push('%'+constr[con]+'%')
    }
    i ++
  }
  var where_str = "";
  if (where.length > 0) {
    where_str = "WHERE "+where.join(" AND ")
  }
  return [where_str, vals]
}

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
         author varchar(45),
         description varchar(1000),
         geohash varchar(45),
         image int REFERENCES images(guid),
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
         image int REFERENCES images(guid),
         PRIMARY KEY(guid)
     )
    `, [], (err, result) => {})

    pool.query(
      `CREATE TABLE IF NOT EXISTS images (
          guid int,
          image bytea,
          PRIMARY KEY(guid)
      )`, [], (err, result) => {}
    )

    return pool
}

function insertTrail(pool, trail) {
  trail.guid = guid()
  trail.pass = secureHash(trail.pass)
  pool.query(`INSERT INTO trails VALUES ($1,$2,$3,$4,$5,$6)`, [
    trail.guid,
    trail.name,
    trail.author,
    trail.description,
    trail.geohash,
    trail.image,
    trail.pass
  ], (err, result) => { console.log(err) })
}

function getTrails(pool, constr, rules, callback) {
  ws = whereStr(constr, rules)
  where_str = ws[0]
  vals = ws[1]
  pool.query(`SELECT * FROM trails ${ where_str }`, vals, (err, rows) => {
    console.log(err)
    rows = rows.rows
    for (row in rows) {
      delete rows[row].pass
    }
    callback(rows)
  })
}

module.exports = {initDb: initDb, insertTrail: insertTrail, getTrails: getTrails}
