import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";

import client from "./utils/client";
import { appLimiter } from "./utils/rateLimit";

dotenv.config();
const PORT = process.env.PORT;

const app: Application = express();

//- GLOBAL MIDDLEWARE
app.use(express.json());
app.use(cors());
app.use(appLimiter);

//- VIEW ENGINE

//- ROUTE

async function connectServer() {
    try {
        // await client.connect()
        console.log("Connected to Redis...");

        app.listen(PORT, function() {
            console.log(`Server is running on port: ${PORT}`)
        });
    } catch (error) {
        console.error("Server failed to connect", error);
    }
};
connectServer();