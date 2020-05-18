const express = require('express')

app = express()
const PORT = process.env.PORT || 5000

app.get("/", function (req, res) {
  res.send('Hello World!')
})

app.listen(PORT, () => 'Running Tour App on port ${ PORT }')
