
$(document).ready(() => 
{
    const protocol = document.location.protocol.startsWith('https') ? 'wss://' : 'ws://';
    const webSocket = new WebSocket(protocol + location.host);
    
    const maximalTemperature = 28;
    
    const loadingScreenDiv = document.getElementById("loading-screen");
    const dashboardDiv = document.getElementsByClassName('blur-filter')[0];
    const currentTemperatureDiv = document.getElementById('current-temperature');
    const temperatureStatusDiv = document.getElementById('temperature-status');
    const temperatureAverage = document.getElementById('temperature-average')
    
    const currentTemperatureText = currentTemperatureDiv.getElementsByTagName("h3")[0];
    const temperatureStatusText = temperatureStatusDiv.getElementsByTagName("h3")[0];
    const temperatureAverageText = temperatureAverage.getElementsByTagName("h3")[0];
    
    let firstLoad = true;
 
    webSocket.onmessage = function onMessage(message) 
    {
        try 
        {
            const messageData = JSON.parse(message.data);

            if(messageData.LatestTemperature && messageData.TemperatureAverage) 
            {
                currentTemperature = parseFloat(messageData.LatestTemperature);

                updateCurrentTemperature(currentTemperature);
                updateTemperatureStatus(currentTemperature);
                updateTemperatureAverage(parseFloat(messageData.TemperatureAverage));

                if(firstLoad){
                    disableLoadingScreen();
                }
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
        if(temperatureAverage != null)
        {
            temperatureAverageText.innerHTML = Math.floor(temperatureAverage * 100) / 100 + " °C";
        }
        else 
        {
            temperatureAverageText.innerHTML = "N/A";
        }
    }

    function disableLoadingScreen(){
        firstLoad = false;
        dashboardDiv.classList.remove("blur-filter");
        loadingScreenDiv.style.visibility='hidden';
    }
});

