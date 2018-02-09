#!/usr/bin/env node

const charm = require('charm')();
const program = require('commander');
const csvWriter = require('csv-write-stream');
const { Client } = require('tplink-smarthome-api');

program
  .option('--interval <n>', 'The time in seconds between readings', parseFloat, 0.5)
  .option('--live-averages')
  .parse(process.argv);

const client = new Client();

let plugs = [];

charm.pipe(process.stdout);

const csv = csvWriter();
csv.pipe(process.stdout);

let lastPollLines = 0;

function poll() {
  let out = '';
  let readingPromises = [];

  for (let plug of plugs) {
    let promise = plug.emeter.getRealtime();
    promise.then((readings) => {
      if (program.liveAverages) {
        out += plug.alias + '\n';
        out += readings.power.toString() + '\n';
      } else {
        csv.write({
          timestamp: new Date().toISOString(),
          alias: plug.alias,
          power: readings.power
        });
      }
    });
    readingPromises.push(promise);
  }

  if (program.liveAverages) {
    Promise.all(readingPromises).then(() => {
      charm.move(0, -lastPollLines);
      charm.erase('down');
      charm.write(out);
      lastPollLines = out.split('\n').length - 1;
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
