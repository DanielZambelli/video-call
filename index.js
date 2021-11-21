if(process.env.MODE === 'server') require('./server')
if(process.env.MODE === 'peer-server') require('./peer-server')
