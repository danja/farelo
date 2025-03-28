const express = require('express')
const app = express()

app.use(express.static('../../'))

app.get("/", function (req, res) {
 res.send('Hello World!!')
});

// app.get('/', (req, res) => res.send('Hello World!'))

app.listen(4040, () => console.log('Example app listening on port 4040'))
