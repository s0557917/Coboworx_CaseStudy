const { Connection, Request, TYPES } = require("tedious");

function connectToDatabase(){
    const config = {
        authentication: {
        options: {
            userName: process.env.SQLUsername, 
            password: process.env.SQLPassword,
        },
        type: "default"
        },
        server: process.env.AzureServerString, 
        options: {
            database: process.env.AzureDatabaseName, 
            encrypt: true, 
            rowCollectionOnDone: true
        }
    };

    const connection = new Connection(config);    
    return new Promise((resolve, reject) => {
        var connection = new Connection(config);
    
        connection.on('connect', function(err) {
            if (err){
                return reject(err);
            } 
                        
            resolve(connection);
        });

        connection.connect();
    });
}

function insertTelemetryData(connection, timestamp, temperature){

    const insertionRequest = new Request(
        `INSERT INTO TelemetryData (Timestamp, Temperature) VALUES (@timestamp, @temperature)`,
        (err, rowCount) => {
          if (err) 
          {
            console.error(err.message);
          } else 
          {
            console.log("Succesfull SQL insertion");
          }
        }
    );
    insertionRequest.addParameter('timestamp', TYPES.DateTime2, new Date(timestamp));
    insertionRequest.addParameter('temperature', TYPES.Decimal, temperature);
    connection.execSql(insertionRequest);
}

function getLastAddedTemperature(connection){
    return new Promise((resolve, reject) => {
        const request = new Request(
            `SELECT temperature FROM TelemetryData WHERE timestamp = (SELECT MAX(timestamp) FROM TelemetryData)`,
            (error, rowCount, rows) => {
                if (error) {
                    return reject(error);
                }
            }
        ).on('doneInProc', function(rowCount, more, rows)
        {
            resolve(JSON.stringify({LatestTemperature: rows[0].value}));
        });
        connection.execSql(request);
    });
}

function getTemperatureAverageFromLastDay(connection){
    return new Promise((resolve, reject) => {
        const request = new Request(
            `SELECT temperature FROM TelemetryData WHERE timestamp >= DATEADD(day, -1, GETDATE())`,
            (error, rowCount, rows) => 
            {
                if (error) 
                {
                    return reject(error);
                }
            }
        ).on('doneInProc', function(rowCount, more, rows)
        {
            let average = rows.map(a => a[0].value).reduce((a,b) => a + b, 0)/rowCount;
            resolve(JSON.stringify({TemperatureAverage: average}));
        });
        
        connection.execSql(request);
    });
}

module.exports = {
    connectToDatabase, insertTelemetryData, getLastAddedTemperature, getTemperatureAverageFromLastDay
}