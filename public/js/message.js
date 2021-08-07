module.exports = class Message {
    
    constructor(timeStamp, temperature){
        this.timeStamp = timeStamp;
        this.temperature = temperature;

        console.log("TIME: ", timeStamp, " - TEMP: ", temperature)
    }

    // function isFromToday(){
    //     if(){}
    // }
}