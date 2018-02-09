#!/usr/bin/env node

const charm = require('charm')();
const program = require('commander');
const csvWriter = require('csv-write-stream');
const { Client } = require('tplink-smarthome-api');

program
  .option('--interval <n>', 'The time in seconds between readings', parseFloat, 1)
  .option('--live-averages')
  .parse(process.argv);

const client = new Client();

let plugs = [];

charm.pipe(process.stdout);

const csv = csvWriter();
csv.pipe(process.stdout);

let lastPollLines = 0;

let dataForPlugs = [];

function round(number) {
  const precision = 2;
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

function calculateAverage(allData, interval) {
  let startOfInterval = new Date() - (interval * 1000);
  let intervalExceeded = false;
  let readings = [];
  for (let data of allData) {
    if (data.timestamp < startOfInterval) {
      intervalExceeded = true;
      continue;
    } else {
      readings.push(data.power);
    }
  }

  if (intervalExceeded) {
    const mean = readings.reduce((a, b) => a + b) / readings.length;
    return `last ${interval} seconds: ${round(mean)}\n`;
  } else {
    return '';
  }
}

function poll() {
  let out = '';
  let readingPromises = [];

  for (let plug of plugs) {
    let promise = plug.emeter.getRealtime();
    promise.then((readings) => {
      if (program.liveAverages) {
        out += `${plug.alias}\n`;
        out += `${round(readings.power)}\n`;

        let data = {
          timestamp: new Date(),
          plug: plug,
          power: readings.power
        };
        const allDataForThisPlug = dataForPlugs[plug];
        allDataForThisPlug.push(data);

        out += calculateAverage(allDataForThisPlug, 5);
        out += calculateAverage(allDataForThisPlug, 10);
        out += calculateAverage(allDataForThisPlug, 30);
        out += calculateAverage(allDataForThisPlug, 60);
        out += calculateAverage(allDataForThisPlug, 120);
        out += calculateAverage(allDataForThisPlug, 300);
        out += calculateAverage(allDataForThisPlug, 600);
      } else {
        csv.write({
          timestamp: new Date().toISOString(),
          alias: plug.alias,
          power: round(readings.power),
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
  dataForPlugs[plug] = [];

  // Kick off polling when we've found our first plug:
  if (plugs.length == 1) {
    setInterval(poll, program.interval * 1000);
    poll();
  }
});
