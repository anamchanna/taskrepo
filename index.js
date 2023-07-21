import express from 'express'

const app = express()

app.use(express.static('html'))

const listener = await app.listen(3000)
console.log(`Listening on port ${listener.address().port}`)
