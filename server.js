require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const EventHubReader = require('./scripts/event-hub-reader.js');
const { runGetLatestTemperatureQuery, runGetTemperatureAverageFromLastDay, runTelemetryInsertionQuery } = require('./scripts/data-base-manager.js')

const iotHubConnectionString = process.env.IOT_HUB_CONNECTION_STRING;
if (!iotHubConnectionString) 
{
  console.error(`Environment variable IotHubConnectionString must be specified.`);
  return;
}

const eventHubConsumerGroup = process.env.EVENT_HUB_CONSUMER_GROUP;
if (!eventHubConsumerGroup) 
{
  console.error(`Environment variable EventHubConsumerGroup must be specified.`);
  return;
}

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res ) => 
{
  res.redirect('/');
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.broadcast = (data) => 
{
  wss.clients.forEach((client) => 
  {
    if (client.readyState === WebSocket.OPEN) 
    {
      try 
      {
        client.send(data);
      } catch (e) 
      {
        console.error(e);
      }
    }
  });
};

server.listen(process.env.PORT || '3000', () => 
{
  console.log('Listening on %d.', server.address().port);
});

const eventHubReader = new EventHubReader(iotHubConnectionString, eventHubConsumerGroup);

wss.on('connection', function(ws, request){
  getAndBroadcastTemperatureData();
});

(async () => 
{
  await eventHubReader.startReadMessage((message, date, deviceId) => 
  {
    try 
    {
      runTelemetryInsertionQuery(date, parseFloat(message.temperature)).then(() => {
        getAndBroadcastTemperatureData();
      });

    } catch (err) 
    {
      console.error('Error broadcasting: [%s] from [%s].', err, message);
    }
  });
})().catch();

function getAndBroadcastTemperatureData(){
  runGetLatestTemperatureQuery().then(value => {
    if(value)
    {
      wss.broadcast(JSON.stringify({ LatestTemperature: value.recordset[0].temperature }));
    }
  });
  
  runGetTemperatureAverageFromLastDay().then(value => {
    if(value)
    {
      average = calculateTemperatureAverage(value);
      wss.broadcast(JSON.stringify({TemperatureAverage: average}));
    }
  });
}

function calculateTemperatureAverage(temperatures){
  let average = 0;
  for(let i=0; i<temperatures.recordset.length; i++){
    average += temperatures.recordset[i].temperature;
  }
  average = average / temperatures.recordset.length;
  return average;
}