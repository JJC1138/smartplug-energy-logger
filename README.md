# smartplug-energy-logger
A command-line tool for logging the energy use reported by the TP-Link HS110 Smartplug.

## Usage
The tool discovers all compatible smartplugs on your network and polls and reports their current energy usage. There are two modes. The first mode simply logs the readings in a CSV (comma-separated values) format:
```
$ smartplug-energy-logger
timestamp,alias,power
2018-02-09T01:12:20.800Z,My Smart Plug,162.04
2018-02-09T01:12:21.831Z,My Smart Plug,162.49
2018-02-09T01:12:22.796Z,My Smart Plug,162.5
2018-02-09T01:12:23.799Z,My Smart Plug,162.47
2018-02-09T01:12:24.798Z,My Smart Plug,162.01
2018-02-09T01:12:25.806Z,My Smart Plug,162.36
2018-02-09T01:12:26.808Z,My Smart Plug,162.41
```

The second mode shows the current energy usage and moving averages for several time periods (each new time period is added when you have been monitoring for that long). Both the current energy usage and the averages update continuously:
```
$ smartplug-energy-logger --live-averages
My Smart Plug
162.65
last 5 seconds: 162.28
last 10 seconds: 162.16
last 30 seconds: 162.18
last 60 seconds: 162.16
last 120 seconds: 162.15
last 300 seconds: 162.16
last 600 seconds: 162.16
last 1200 seconds: 162.16
last 1800 seconds: 162.19
last 3600 seconds: 162.24
```

## Acknowledgments

All the heavy lifting of accessing the device and reading its data is done by the excellent [tplink-smarthome-api](https://github.com/plasticrake/tplink-smarthome-api) library.
