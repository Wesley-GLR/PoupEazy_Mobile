'use strict';
// Bridge only local IPv4 to the already running local IPv6 Metro listener.
// No Expo process is started and no LAN/tunnel address is exposed.
const net = require('node:net');
const server = net.createServer(client => {
  const upstream = net.createConnection({ host: '::1', port: 8081 });
  client.pipe(upstream).pipe(client);
  const close = () => { client.destroy(); upstream.destroy(); };
  client.on('error', close);
  upstream.on('error', close);
});
server.on('error', error => { console.error(error.code); process.exitCode = 1; });
server.listen(8081, '127.0.0.1', () => console.log('Relay somente loopback: 127.0.0.1:8081 -> [::1]:8081'));
