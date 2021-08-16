require('dotenv').config();
const sql = require('mssql');

const sqlConfig = {
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

async function runTelemetryInsertionQuery(timestamp, temperature) {
  try {
    const pool = await sql.connect(sqlConfig);
    return pool.request()
      .input('timestamp', sql.DateTime2, timestamp)
      .input('temperature', sql.Decimal(10, 5), temperature)
      .query('INSERT INTO TelemetryData (Timestamp, Temperature) VALUES (@timestamp, @temperature)');
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

async function runGetLatestTemperatureQuery() {
  try {
    const pool = await sql.connect(sqlConfig);
    return pool.request().query('SELECT Temperature FROM TelemetryData WHERE Timestamp = (SELECT MAX(Timestamp) FROM TelemetryData)');
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

async function runGetTemperatureAverageFromLastDay() {
  try {
    const pool = await sql.connect(sqlConfig);
    return pool.request().query('SELECT Temperature FROM TelemetryData WHERE Timestamp >= DATEADD(day, -1, GETDATE())');
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

module.exports = {
  runGetLatestTemperatureQuery,
  runTelemetryInsertionQuery,
  runGetTemperatureAverageFromLastDay
};