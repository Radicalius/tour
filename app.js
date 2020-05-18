const express = require('express')
const db = require('./db')

app = express()
const PORT = process.env.PORT

var pool = db.initDb()

app.listen(PORT, () => 'Running Tour App on port ${ PORT }')
