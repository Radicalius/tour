const { Pool } = require('pg')
const crypto = require('crypto');

function guid(){
  return Math.floor(Math.random() * (2**31 - 1))
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

function insert(pool, table, values, res) {
  var nums = []
  for (i = 0; i < values.length; i++) {
    nums.push("$"+(i+1))
  }
  console.log(`INSERT INTO ${ table } VALUES (${ nums.join(",") })`)
  pool.query(`INSERT INTO ${ table } VALUES (${ nums.join(",") })`, values, (err, result) => {
    if (err) {
      console.log(err)
      res.status(500)
      res.send('Database Error')
    } else {
      res.send('')
    }
  })
}

function insertTrail(pool, trail, res) {
  trail.guid = guid()
  trail.pass = secureHash(trail.pass)
  insert(pool, 'trails', [trail.guid, trail.name, trail.author, trail.description, trail.geohash, trail.image, trail.pass], res)
}

function insertPoint(pool, point, res) {
  point.guid = guid()
  insert(pool, 'points', [point.guid, point.name, point.description, point.trail, point.geohash, point.image], res)
}

function get(pool, table, constr, rules, callback) {
  ws = whereStr(constr, rules)
  where_str = ws[0]
  vals = ws[1]
  pool.query(`SELECT * FROM ${ table } ${ where_str }`, vals, (err, rows) => {
    console.log(err)
    rows = rows.rows
    for (row in rows) {
      delete rows[row].pass
    }
    callback(rows)
  })
}

function getTrails(pool, constr, rules, callback) {
  get(pool, 'trails', constr, rules, callback)
}

function getPoints(pool, constr, rules, callback) {
  get(pool, 'points', constr, rules, callback)
}

function authTrail(pool, guid, auth, res, callback) {
  pool.query(`SELECT pass FROM trails WHERE guid = $1`, [guid], (err, rows) => {
    if (rows.rows.length == 0) {
      res.status(404)
      res.send(JSON.stringify({error: 'Trail with specified GUID not found'}))
      return
    }
    if (rows.rows[0].pass != secureHash(auth)) {
      res.status(403)
      res.send(JSON.stringify({error: 'Invalid Credentials'}))
      return
    }
    callback()
  })
}

function authPoint(pool, guid, auth, res, callback) {
  pool.query(`SELECT trail FROM points WHERE guid = $1`, [guid], (err, rows) => {
    if (rows.rows.length == 0) {
      res.status(404)
      res.send(JSON.stringify({error: 'Point with specified GUID not found'}))
      return
    }
    authTrail(pool, rows.rows[0].trail, auth, res, callback)
  })
}

function updateTrail(pool, body) {
  var updates = []
  var vals = []
  var i = 1
  for (elem in body) {
    if (elem !== "guid" && elem !== "auth") {
      updates.push(`${ elem } = $${ i }`)
      if (elem === "pass") {
        body[elem] = secureHash(body.elem)
      }
      vals.push(body[elem])
      i ++
    }
  }
  vals.push(body.guid)
  updateStr = updates.join(', ')
  console.log(`UPDATE trails SET ${ updates } WHERE guid = $${ i }`)
  pool.query(`UPDATE trails SET ${ updates } WHERE guid = $${ i }`, vals, (err, rows) => {
    if (err) {
      console.log(err)
    }
  })
}

function _delete(pool, table, guid) {
  pool.query(`DELETE FROM ${ table } WHERE guid = $1`, [guid], (err, rows) => {
    console.log(err)
  })
}

function deleteTrail(pool, guid) {
  _delete(pool, 'trails', guid)
}

function deletePoint(pool, guid) {
  _delete(pool, 'points', guid)
}

function createImage(pool, imgData) {
  var g = guid()
  pool.query('INSERT INTO images VALUES ($1,$2)', [
    g,
    imgData
  ], (err, result) => { console.log(err) })
  return g
}

function getImage(pool, id, res) {
  pool.query('SELECT image FROM images WHERE guid=$1', [id], (err, result) => {
    if (typeof(err) !== "undefined" || result.rows.length == 0) {
      res.status(404)
      res.send('Image not Found')
    } else {
      console.log(result.rows)
      res.send(result.rows[0].image)
    }
  })
}

module.exports = {initDb: initDb, insertTrail: insertTrail, insertPoint: insertPoint, getTrails: getTrails, getPoints: getPoints, authTrail: authTrail, authPoint: authPoint, updateTrail: updateTrail, createImage: createImage, getImage: getImage, deleteTrail: deleteTrail, deletePoint: deletePoint}
