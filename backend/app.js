const express = require('express')
const mongoose = require('mongoose')
const routes = require('./routes')
const cors = require('cors')
const cookierParser = require('cookie-parser')
const port = process.env.BACKEND_PORT

mongoose.connect(process.env.MONGO_URL, {}, () => {
  console.log('Successfully connected to the Database.')
})

const app = express()

app.use(express.json())
app.use(cors({
  credentials: true,
  origin: ['frontend:' + process.env.FRONTEND_PORT]
}))
app.use(cookierParser())
app.use('/api', routes)


app.get('/', (req, res) => {
  res.send('Hello World!')
})



app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`)
})
