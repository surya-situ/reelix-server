import { Router, Request, Response, NextFunction } from "express";
import axios from "axios";
import Redis from "ioredis";

import { appError } from "../utils/appError";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();
const redis = new Redis();

router.get("/popular-reelix-videos", async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Defining a cache key for storing the videos in Redis
        const cacheKey = "reelix-videos";
        const cachedData = await redis.get(cacheKey);

        // If cached data exists, return the cached data as response
        if( cachedData ) {
            res.json(JSON.parse( cachedData ));
            return;
        };

        const apiUrl: string | undefined = process.env.REELIX_VIDEOS!;
        const apiKey: string | undefined = process.env.REELIX_API_KEY!;
        const url = `${apiUrl}${apiKey}`;
        const response = await axios.get(url);

        const popularVideos = response.data.items.slice(0, 10);

        // Structuring the response data
        const videos = {
            status: "Success",
            message: "Successfully fetched reelix videos",
            data: popularVideos,
            length: popularVideos.length
        };

        // Storing the fetched data in Redis with a 1-hour expiration time
        await redis.setex(cacheKey, 3600, JSON.stringify(videos));

        res.status(200).json(videos);
        return;
    } catch (error) {
        next(appError(500, "Something went wrong while Fetching videos"));
        return;
    }
});


router.get("/reelix-videos",authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Defining a cache key for storing the videos in Redis
        const cacheKey = "reelix-videos";
        const cachedData = await redis.get(cacheKey);

        // If cached data exists, return the cached data as response
        if( cachedData ) {
            res.json(JSON.parse( cachedData ));
            return;
        };

        const apiUrl: string | undefined = process.env.REELIX_VIDEOS!;
        const apiKey: string | undefined = process.env.REELIX_API_KEY!;
        const url = `${apiUrl}${apiKey}`;
        const response = await axios.get(url);

        // Structuring the response data
        const videos = {
            status: "Success",
            message: "Successfully fetched reelix videos",
            data: response.data.items,
            length: response.data.items.length
        };

        // Storing the fetched data in Redis with a 1-hour expiration time
        await redis.setex(cacheKey, 3600, JSON.stringify(videos));

        res.status(200).json(videos);
        return;
    } catch (error) {
        next(appError(500, "Something went wrong while Fetching videos"));
        return;
    }
});

export default router;