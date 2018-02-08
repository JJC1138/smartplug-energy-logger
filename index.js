#!/usr/bin/env node

const program = require('commander');
const csvWriter = require('csv-write-stream');
const { Client } = require('tplink-smarthome-api');

program
  .option('--interval <n>', 'The time in seconds between readings', parseFloat, 0.5)
  .parse(process.argv);

const client = new Client();

let plugs = [];

const csv = csvWriter();
csv.pipe(process.stdout);

function poll() {
  for (let plug of plugs) {
    plug.emeter.getRealtime().then((readings) => {
      csv.write({
        timestamp: new Date().toISOString(),
        alias: plug.alias,
        power: readings.power
      });
    });
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
