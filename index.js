#!/usr/bin/env node

const program = require('commander');
const { Client } = require('tplink-smarthome-api');

program
  .option('--interval <n>', 'The time in seconds between readings', parseFloat, 0.5)
  .parse(process.argv);

const client = new Client();

let plugs = [];

function poll() {
  for (let plug of plugs) {
    // FIXME implement
    console.log(plug.alias);
  }
}

client.startDiscovery().on('plug-new', (plug) => {
  plugs.push(plug);

  // Kick off polling when we've found our first plug:
  if (plugs.length == 1) {
    setInterval(poll, program.interval * 1000);
    poll();
  }
});
