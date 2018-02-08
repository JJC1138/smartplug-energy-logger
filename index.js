#!/usr/bin/env node

const { Client } = require('tplink-smarthome-api');
 
const client = new Client();

client.startDiscovery().on('device-new', (device) => {
  device.getSysInfo().then(console.log);
});
