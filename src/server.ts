import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

import { appLimiter } from "./utils/rateLimit";
import { globalError } from "./middlewares/globalError"
import router from "./routes/index.routes";

dotenv.config();
const PORT = process.env.PORT;

const app: Application = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

//- GLOBAL MIDDLEWARE
app.use(express.json());
app.use(cors());
app.use(appLimiter);
app.use(globalError);

//- VIEW ENGINE
app.set("view engine", "ejs");

//- ROUTE
app.use(router);

io.on("connection", function(socket){
    console.log("Socket io is connected", socket);
});

async function connectServer() {
    try {
        console.log("Connected to Redis...");

        server.listen(PORT, function() {
            console.log(`Server is running on port: ${PORT}`)
        });
    } catch (error) {
        console.error("Server failed to connect", error);
    }
};
connectServer();