const express = require('express')
const db = require('./db')

app = express()
app.use(express.json({limit: '10mb'}))
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
      if (form[elem].type === "number") {
        body[elem] = parseInt(body[elem])
        if (body[elem] !== NaN) {
          continue
        }
      }
      res.status(400)
      res.send(JSON.stringify({
        error: "Invalid type for Parameter "+elem+": Expected "+form[elem].type+" but got "+typeof(body[elem])
      }))
      return false
    }
  }
  for (elem in body) {
    if (typeof(form[elem]) === "undefined") {
      res.status(400)
      res.send(JSON.stringify({
        error: "Extraneous Parameter "+elem
      }))
      return false
    }
  }
  return true
}

app.post('/trails', function (req, res) {
  var valid = assertForm(req.body, res, {
    name: {type: "string", required: true},
    author: {type: "string", required: true},
    geohash: {type: "string", required: true},
    image: {type: "number", required: true},
    description: {type: "string", required: true},
    pass: {type: "string", required: true}
  })
  if (valid) {
    db.insertTrail(pool, req.body, res)
  }
});

app.put('/trails', function (req, res) {
  var valid = assertForm(req.body, res, {
    guid: {type: "number", required: true},
    auth: {type: "string", required: true},
    name: {type: "string", required: false},
    author: {type: "string", required: false},
    geohash: {type: "string", required: false},
    image: {type: "number", required: false},
    description: {type: "string", required: false},
    pass: {type: "string", required: false}
  })
  if (valid) {
    db.authTrail(pool, req.body.guid, req.body.auth, res, () => {
      db.updateTrail(pool, req.body)
      res.send('')
    })
  }
})

app.delete('/trails', function (req, res) {
  var valid = assertForm(req.body, res, {
    guid: {type: "number", required: true},
    auth: {type: "string", required: true},
  })
  if (valid) {
    db.authTrail(pool, req.body.guid, req.body.auth, res, () => {
      db.deleteTrail(pool, req.body.guid)
      res.send('')
    })
  }
})

app.get('/trails', function (req, res) {
  var valid = assertForm(req.query, res, {
    guid: {type: "number", required: false},
    name: {type: "string", required: false},
    author: {type: "string", required: false},
    geohash: {type: "string", required: false}
  })
  if (valid) {
    db.getTrails(pool, req.query, {
      guid: "exact",
      name: "substr",
      geohash: "prefix",
      author: "substr"
    }, (rows) => {
      res.send(JSON.stringify(rows))
    })
  }
});

app.post('/points', function (req, res) {
  var valid = assertForm(req.body, res, {
    name: {type: "string", required: true},
    geohash: {type: "string", required: true},
    image: {type: "number", required: true},
    description: {type: "string", required: true},
    trail: {type: "number",required: true},
    auth: {type: "string", required: true}
  })
  if (valid) {
    db.authTrail(pool, req.body.trail, req.body.auth, res, () => {
      db.insertPoint(pool, req.body, res)
    })
  }
})

app.get('/points', function (req, res) {
  var valid = assertForm(req.query, res, {
    guid: {type: "number", required: false},
    name: {type: "string", required: false},
    geohash: {type: "string", required: false},
    trail: {type: "number", required: false}
  })
  if (valid) {
    db.getPoints(pool, req.query, {
      guid: "exact",
      name: "substr",
      geohash: "prefix",
      trail: "exact"
    }, (rows) => {
      res.send(JSON.stringify(rows))
    })
  }
});

app.put('/points', function (req, res) {
  var valid = assertForm(req.body, res, {
    guid: {type: "number", required: true},
    auth: {type: "string", required: true},
    name: {type: "string", required: false},
    geohash: {type: "string", required: false},
    image: {type: "number", required: false},
    description: {type: "string", required: false},
    pass: {type: "string", required: false}
  })
  if (valid) {
    db.authPoint(pool, req.body.guid, req.body.auth, res, () => {
      db.updatePoint(pool, req.body)
      res.send('')
    })
  }
})

app.delete('/points', function (req, res) {
  var valid = assertForm(req.body, res, {
    guid: {type: "number", required: true},
    auth: {type: "string", required: true},
  })
  if (valid) {
    db.authPoint(pool, req.body.guid, req.body.auth, res, () => {
      db.deletePoint(pool, req.body.guid)
      res.send('')
    })
  }
})

app.post('/images', function (req, res) {
  var g = db.createImage(pool, req.body.data)
  res.status(200)
  res.send(Number(g).toString())
})

app.get('/images/:image', function(req, res) {
  db.getImage(pool, req.params.image, res)
})

app.listen(PORT, () => 'Running Tour App on port ${ PORT }')
