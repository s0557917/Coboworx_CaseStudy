require('dotenv').config();
const sql = require('mssql');

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

async function runTelemetryInsertionQuery(timestamp, temperature)
{
    try
    {
        let pool = await sql.connect(sqlConfig);
        return pool.request()
        .input('timestamp', sql.DateTime2, timestamp)
        .input('temperature', sql.Float, temperature)
        .query(`INSERT INTO TelemetryData (Timestamp, Temperature) VALUES (@timestamp, @temperature)`);
    }
    catch (error)
    {
        console.error(error);
    }
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

async function runGetTemperatureAverageFromLastDay()
{
    try
    {
        let pool = await sql.connect(sqlConfig);
        return pool.request().query(`SELECT temperature FROM TelemetryData WHERE timestamp >= DATEADD(day, -1, GETDATE())`);
    }
    catch(error)
    {
        console.error(error);
    }
}

module.exports = 
{
    runGetLatestTemperatureQuery,
    runTelemetryInsertionQuery, 
    runGetTemperatureAverageFromLastDay
}