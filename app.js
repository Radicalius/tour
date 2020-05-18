const express = require('express')
const db = require('./db')

app = express()
app.use(express.json())
const PORT = process.env.PORT

var pool = db.initDb()

function assertForm (body, res, form) {
  for (elem in form) {
    if (form[elem].required && typeof(body[elem]) === "undefined") {
      res.status(400)
      res.send(JSON.stringify({
        error: "Missing Parameter "+elem
      }))
      return false
    }
    if (typeof(body[elem]) !== "undefined" && typeof(body[elem]) !== form[elem].type) {
      res.status(400)
      res.send(JSON.stringify({
        error: "Invalid type for Parameter "+elem+": Expected "+form[elem].type+" but got "+typeof(body[elem])
      }))
      return false
    }
  }
  return true
}

app.post('/trails', function (req, res) {
  console.log(req.body)
  var valid = assertForm(req.body, res, {
    name: {type: "string", required: true},
    geohash: {type: "string", required: true},
    image: {type: "string", required: true},
    description: {type: "string", required: true},
    pass: {type: "string", required: true}
  })
  if (valid) {
    db.insertTrail(pool, req.body)
    res.send('')
  }
});

app.listen(PORT, () => 'Running Tour App on port ${ PORT }')
