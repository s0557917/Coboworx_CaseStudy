require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const EventHubReader = require('./scripts/event-hub-reader.js');
const {
  runGetLatestTemperatureQuery, runGetTemperatureAverageFromLastDay, runTelemetryInsertionQuery
} = require('./scripts/data-base-manager.js');

const iotHubConnectionString = process.env.IOT_HUB_CONNECTION_STRING;
if (!iotHubConnectionString) {
  console.error('Environment variable IotHubConnectionString must be specified.');
}

const eventHubConsumerGroup = process.env.EVENT_HUB_CONSUMER_GROUP;
if (!eventHubConsumerGroup) {
  console.error('Environment variable EventHubConsumerGroup must be specified.');
}

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res) => {
  res.redirect('/');
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(data);
      } catch (e) {
        console.error(e);
      }
    }
  });
};

server.listen(process.env.PORT || '3000', () => {
  console.log('Listening on %d.', server.address().port);
});

const eventHubReader = new EventHubReader(iotHubConnectionString, eventHubConsumerGroup);

wss.on('connection', () => {
  getAndBroadcastTemperatureData();
});

(async () => {
  await eventHubReader.startReadMessage((message, date) => {
    try {
      runTelemetryInsertionQuery(date, message.temperature).then(() => {
        getAndBroadcastTemperatureData();
      });
    } catch (err) {
      console.error('Error broadcasting: [%s] from [%s].', err, message);
    }
  });
})().catch();

function getAndBroadcastTemperatureData() {
  let latestTemperature;
  let avgTemperature;

  runGetLatestTemperatureQuery().then((temperatureQuery) => {
    if (temperatureQuery !== undefined) {
      latestTemperature = temperatureQuery.recordset[0].Temperature;

      runGetTemperatureAverageFromLastDay().then((avgQuery) => {
        if (avgQuery !== undefined) {
          avgTemperature = calculateTemperatureAverage(avgQuery);
        } else {
          avgTemperature = null;
        }
        wss.broadcast(JSON.stringify(
          {
            LatestTemperature: latestTemperature,
            TemperatureAverage: avgTemperature
          }
        ));
      });
    }
  });
}

function calculateTemperatureAverage(temperatures) {
  let average = 0;
  for (let i = 0; i < temperatures.recordset.length; i++) {
    average += temperatures.recordset[i].Temperature;
  }
  average /= temperatures.recordset.length;
  return average;
}