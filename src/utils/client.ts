import Redis from "ioredis";

const client = new Redis();

client.on("connect", function() {
    console.log("Connected to redis...");
});

client.on("error", function(error) {
    console.log("Redis connection error: ", error);
});


export default client;