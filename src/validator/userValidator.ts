import { z } from "zod";

export const signUpSchema = z.object(
    {
        email: z.string({ message: "Email is required" })
            .email({ message: "Invalid email address" }),
        name: z.string({ message: "Name is required" })
            .min( 3, { message: "Name must be 3 or more characters long" })
            .max(120, { message: "Name must not be more than 120 characters long" }),
        password: z.string({ message: "Password is required" })
            .min(6, { message: "Password must be at least 6 character long" })
            .max(60, { message: "Password must not be more than 60 character long" }),
    }
);

export const loginSchema = z.object(
    {
        email: z.string({ message: "Email is required" })
            .email({ message: "Invalid email address" }),
        password: z.string({ message: "Password is required" })
    }
)