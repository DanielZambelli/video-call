const { PeerServer } = require('peer')
PeerServer({
  port: process.env.PORT,
  path: '/vvpc-peer',
  key: 'vvcp',
})
