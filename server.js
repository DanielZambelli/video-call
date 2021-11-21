const path = require('path')
const express = require('express')
const app = express()
const server = app.listen(process.env.PORT)
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"]
  }
})

const users = []

io.on('connection', socket => {
  if(!users.includes(socket.id)) users.push(socket.id)
  socket.broadcast.emit('users', users)
  socket.on('users', () => socket.emit('users', users))
  setTimeout(() => socket.emit('users', users), 1000)
  socket.on('disconnect', () => {
    users.splice(users.indexOf(socket.id), 1)
    socket.broadcast.emit('users', users)
  })
})

app.use(express.static('build'))

// fallback to serving app
app.get('*', (req, res) => {
  return res.sendFile(path.resolve(__dirname+'/build/index.html'))
})
