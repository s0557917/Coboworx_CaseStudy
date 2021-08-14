require('dotenv').config();
const sql = require('mssql');
let connectionPool;
let connection;
const sqlConfig = 
{
    user: process.env.SQL_USERNAME,
    password: process.env.SQL_PASSWORD,
    database: process.env.AZURE_DATABASE_NAME,
    server: process.env.AZURE_SERVER_STRING,
    pool: 
    {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: 
    {
        encrypt: true, 
        trustServerCertificate: true 
    }
};

function establishDBConnection()
{
    connectionPool = new sql.ConnectionPool(sqlConfig);
    connection = connectionPool.connect();
}

async function runTelemetryInsertionQuery(timestamp, temperature)
{
    try
    {
        let pool = await sql.connect(sqlConfig);
        return pool.request()
        .input('timestamp', sql.DateTime2, timestamp)
        .input('temperature', sql.Decimal, temperature)
        .query(`INSERT INTO TelemetryData (Timestamp, Temperature) VALUES (@timestamp, @temperature)`);
    }
    catch (error)
    {
        console.error(error);
    }

    // sql.connect(sqlConfig).then(pool => {      
    //     pool.request()
    //     .input('timestamp', sql.DateTime2, timestamp)
    //     .input('temperature', sql.Decimal, temperature)
    //     .query(`INSERT INTO TelemetryData (Timestamp, Temperature) VALUES (@timestamp, @temperature)`)
    // }).then(result => {
    //     console.log("Succesfull SQL insertion");
    // }).catch(error => {
    //     reject(error);
    // });
}

async function runGetLatestTemperatureQuery()
{  
    try
    {
        let pool = await sql.connect(sqlConfig);
        return pool.request().query(`SELECT temperature FROM TelemetryData WHERE timestamp = (SELECT MAX(timestamp) FROM TelemetryData)`);
    }
    catch(error)
    {
        console.error(error);
    }
}

// function insertTelemetryData(connection, timestamp, temperature)
// {

//     return new Promise((resolve, reject) => 
//     {
//         const insertionRequest = new Request
//         (
//             `INSERT INTO TelemetryData (Timestamp, Temperature) VALUES (@timestamp, @temperature)`,
//             (err, rowCount) => 
//             {
//                 if (error) 
//                 {
//                     reject(error);
//                 }
//             }
//         ).on('doneInProc', function(errors, rowCount, row)
//         {
//             if(errors)
//             {
//                 reject(errors);
//             }
//             else 
//             {
//                 resolve();
//             }
//         });
//         insertionRequest.addParameter('timestamp', TYPES.DateTime2, new Date(timestamp));
//         insertionRequest.addParameter('temperature', TYPES.Decimal, temperature);
//         connection.execSql(insertionRequest);
//     });
// }


async function runGetTemperatureAverageFromLastDay(connection)
{
    try
    {
        let pool = await sql.connect(sqlConfig);
        return pool.request().query(`SELECT temperature FROM TelemetryData WHERE timestamp >= DATEADD(day, -20, GETDATE())`);
    }
    catch(error)
    {
        console.error(error);
    }
}

module.exports = 
{
    establishDBConnection, 
    runGetLatestTemperatureQuery,
    runTelemetryInsertionQuery, 
    runGetTemperatureAverageFromLastDay
}