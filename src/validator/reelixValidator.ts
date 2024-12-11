import { z } from "zod";

export const reelixSchema = z.object(
    {
        title: z.string({ message: "Title is required" }),
        description: z.string({ message: "Description is required" })
            .min(20, { message: "Description must be more than 20 words" })
            .max(500, { message: "Description must be less than 500 words long." }),
        expireTime: z.string({ message: "Expire time is required" })
            .refine((val) => {
                const date = new Date(val);
                return !isNaN(date.getTime());
            }, { message: "Please pass a correct time" })
            .transform((val) => new Date(val).getTime())
            .refine((val) => val > Date.now(), { message: "Expire time must be in the future" })
            .refine((val) => val - Date.now() <= 5 * 24 * 60 * 60 * 1000, { message: "Expire time must be within 5 days" }),
        videos: z.array(z.string(), { message: "Videos must be an array of video URLs" })
            .min(2, { message: "Minimum 2 videos are required" })
    }
);