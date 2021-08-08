
$(document).ready(() => {
    const protocol = document.location.protocol.startsWith('https') ? 'wss://' : 'ws://';
    const webSocket = new WebSocket(protocol + location.host);

    const maximalTemperature = 28;

    const currentTemperatureDiv = document.getElementById('current-temperature');
    const temperatureStatusDiv = document.getElementById('temperature-status');
    const temperatureAverage = document.getElementById('temperature-average')

    const currentTemperatureText = currentTemperatureDiv.getElementsByTagName("h3")[0];
    const temperatureStatusText = temperatureStatusDiv.getElementsByTagName("h3")[0];
    const temperatureAverageText = temperatureAverage.getElementsByTagName("h3")[0];
 
    webSocket.onmessage = function onMessage(message) {
        try {
            const messageData = JSON.parse(message.data);

            if(messageData.LatestTemperature){
                updatFrontend(messageData.LatestTemperature);
            }

            if (!messageData.MessageDate || (!messageData.IotData.temperature && !messageData.IotData.humidity)) {
                return;
            }
            
            currentTemperature = parseFloat(messageData.IotData.temperature);

            if(messageData.IotData.temperature){
                currentTemperatureText.innerHTML = Math.floor(currentTemperature * 100) / 100 + " °C";
                
                if(parseFloat(messageData.IotData.temperature) < maximalTemperature){
                    temperatureStatusText.innerHTML = "STATUS: OK";
                    temperatureStatusDiv.className = "ok";
                }else{
                    temperatureStatusText.innerHTML = "STATUS: TOO HOT!";
                    temperatureStatusDiv.className = "bad";
                }
            }else{
                currentTemperatureText.innerHTML = "N/A";
                currentTemperatureText.class = "neutral"
                temperatureStatusDiv.innerHTML = "N/A";
                temperatureStatusDiv.class = "neutral"
            }
        } catch (err) 
        {
            console.error(err);
        }
    }

    function updatFrontend(latestTemperature){
        currentTemperature = parseFloat(latestTemperature);

        updateCurrentTemperatureDiv(currentTemperature);
        updateTemperatureStatusDiv(currentTemperature);
        // currentTemperatureText.innerHTML = "N/A";
        // currentTemperatureText.class = "neutral"
        // temperatureStatusDiv.innerHTML = "N/A";
        // temperatureStatusDiv.class = "neutral"
        
    }

    function updateCurrentTemperatureDiv(currentTemperature){
        currentTemperatureText.innerHTML = Math.floor(currentTemperature * 100) / 100 + " °C";
    }

    function updateTemperatureStatusDiv(currentTemperature){
        if(parseFloat(currentTemperature) < maximalTemperature){
            temperatureStatusText.innerHTML = "STATUS: OK";
            temperatureStatusDiv.className = "ok";
        }else{
            temperatureStatusText.innerHTML = "STATUS: TOO HOT!";
            temperatureStatusDiv.className = "bad";
        }
    }

    function updateTemperatureAverage(){

    }
});

