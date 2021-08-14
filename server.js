require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const EventHubReader = require('./scripts/event-hub-reader.js');
const { connectToDatabase, insertTelemetryData, getLastAddedTemperature, getTemperatureAverageFromLastDay, establishDBConnection, runGetLatestTemperatureQuery, runGetTemperatureAverageFromLastDay, runTelemetryInsertionQuery } = require('./scripts/data-base-manager.js')

// let dbConnection;
// connectToDatabase().then(
//   result => dbConnection = result,
//   error => console.error("No connection with DB possible! " + error)
// );

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

runGetLatestTemperatureQuery().then(value => {
  if(value)
  {
    const latestTemperature = 
    {
      LatestTemperature: value.recordset[0].temperature
    }
    wss.broadcast(JSON.stringify(latestTemperature));
    console.log("RETURNED TEMP: ", JSON.stringify(latestTemperature));
  }
});

runGetTemperatureAverageFromLastDay().then(value => {
  if(value)
  {
    let average = 0;
    for(let i=0; i<value.recordset.length; i++){
      average += value.recordset[i].temperature;
    }

    average = average / value.recordset.length;
    const temperatureAverage = {
      TemperatureAverage: average
    }
    wss.broadcast(JSON.stringify(temperatureAverage));
    console.log("RETURNED AVG: ", JSON.stringify(temperatureAverage));
  }
});

const eventHubReader = new EventHubReader(iotHubConnectionString, eventHubConsumerGroup);

(async () => 
{
  await eventHubReader.startReadMessage((message, date, deviceId) => 
  {
    try 
    {
      const payload = 
      {
        IotData: message,
        MessageDate: date || Date.now().toISOString(),
        DeviceId: deviceId,
      };

      runTelemetryInsertionQuery(date, message.temperature);
      wss.broadcast(JSON.stringify(payload));

    } catch (err) 
    {
      console.error('Error broadcasting: [%s] from [%s].', err, message);
    }
  });
})().catch();