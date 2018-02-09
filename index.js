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

let lastPollLines = 0;
let dataForPlugs = [];

charm.pipe(process.stdout);

function pollLiveAverages() {
  let out = '';
  let readingPromises = [];

  for (let plug of plugs) {
    let promise = plug.emeter.getRealtime();
    promise.then((readings) => {
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
      out += calculateAverage(allDataForThisPlug, 2 * 60);
      out += calculateAverage(allDataForThisPlug, 5 * 60);
      out += calculateAverage(allDataForThisPlug, 10 * 60);
      out += calculateAverage(allDataForThisPlug, 20 * 60);
      out += calculateAverage(allDataForThisPlug, 30 * 60);
      out += calculateAverage(allDataForThisPlug, 60 * 60);
      out += calculateAverage(allDataForThisPlug, 6 * 60 * 60);
      out += calculateAverage(allDataForThisPlug, 12 * 60 * 60);
      out += calculateAverage(allDataForThisPlug, 24 * 60 * 60);
    });
    readingPromises.push(promise);
  }

  Promise.all(readingPromises).then(() => {
    charm.move(0, -lastPollLines);
    charm.erase('down');
    charm.write(out);
    lastPollLines = out.split('\n').length - 1;
  });
}

const csv = csvWriter();
csv.pipe(process.stdout);

function pollLog() {
  for (let plug of plugs) {
    plug.emeter.getRealtime().then((readings) => {
      csv.write({
        timestamp: new Date().toISOString(),
        alias: plug.alias,
        power: round(readings.power),
      });
    });
  }
}

const poll = program.liveAverages ? pollLiveAverages : pollLog;

client.startDiscovery().on('plug-new', (plug) => {
  plugs.push(plug);
  dataForPlugs[plug] = [];

  // Kick off polling when we've found our first plug:
  if (plugs.length == 1) {
    setInterval(poll, program.interval * 1000);
    poll();
  }
});
