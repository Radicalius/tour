const express = require('express')
const { Pool } = require('pg')

app = express()
const PORT = process.env.PORT || 5000

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

app.get("/", function (req, res) {
  res.send(`user: ${ user }<br/>pass:${ pass }<br/>host:${host}<br/>port: ${port}<br/>db: ${db}`)
})

app.listen(PORT, () => 'Running Tour App on port ${ PORT }')
