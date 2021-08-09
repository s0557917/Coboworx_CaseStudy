
$(document).ready(() => 
{
    const protocol = document.location.protocol.startsWith('https') ? 'wss://' : 'ws://';
    const webSocket = new WebSocket(protocol + location.host);

    const maximalTemperature = 28;

    const currentTemperatureDiv = document.getElementById('current-temperature');
    const temperatureStatusDiv = document.getElementById('temperature-status');
    const temperatureAverage = document.getElementById('temperature-average')

    const currentTemperatureText = currentTemperatureDiv.getElementsByTagName("h3")[0];
    const temperatureStatusText = temperatureStatusDiv.getElementsByTagName("h3")[0];
    const temperatureAverageText = temperatureAverage.getElementsByTagName("h3")[0];
 
    webSocket.onmessage = function onMessage(message) 
    {
        try 
        {
            const messageData = JSON.parse(message.data);

            if(messageData.LatestTemperature)
            {
                currentTemperature = parseFloat(messageData.LatestTemperature);

                updateCurrentTemperature(currentTemperature);
                updateTemperatureStatus(currentTemperature);

            }
            else if(messageData.TemperatureAverage)
            {
                updateTemperatureAverage(parseFloat(messageData.TemperatureAverage))
            }
            else if (!messageData.MessageDate || (!messageData.IotData.temperature && !messageData.IotData.humidity)) {
                return;
            }
            
            currentTemperature = parseFloat(messageData.IotData.temperature);

            if(messageData.IotData.temperature)
            {
                currentTemperatureText.innerHTML = Math.floor(currentTemperature * 100) / 100 + " °C";
                
                if(parseFloat(messageData.IotData.temperature) < maximalTemperature)
                {
                    temperatureStatusText.innerHTML = "STATUS: OK";
                    temperatureStatusDiv.className = "ok";
                }
                else
                {
                    temperatureStatusText.innerHTML = "STATUS: TOO HOT!";
                    temperatureStatusDiv.className = "bad";
                }
            }
            else
            {
                currentTemperatureText.innerHTML = "N/A";
                currentTemperatureText.class = "neutral"
                temperatureStatusDiv.innerHTML = "N/A";
                temperatureStatusDiv.class = "neutral"
            }
        } 
        catch (err) 
        {
            console.error(err);
        }
    }

    function updateCurrentTemperature(currentTemperature)
    {
        currentTemperatureText.innerHTML = Math.floor(currentTemperature * 100) / 100 + " °C";
    }

    function updateTemperatureStatus(currentTemperature)
    {
        if(parseFloat(currentTemperature) < maximalTemperature)
        {
            temperatureStatusText.innerHTML = "STATUS: OK";
            temperatureStatusDiv.className = "ok";
        }
        else
        {
            temperatureStatusText.innerHTML = "STATUS: TOO HOT!";
            temperatureStatusDiv.className = "bad";
        }
    }

    function updateTemperatureAverage(temperatureAverage)
    {
        temperatureAverageText.innerHTML = Math.floor(temperatureAverage * 100) / 100 + " °C";
    }
});

