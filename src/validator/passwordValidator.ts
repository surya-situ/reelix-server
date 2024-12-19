import { z } from "zod";

export const forgotPasswordSchema = z.object(
    {
        email: z.string({ message: "Email is required" })
            .email({ message: "Invalid email address" }) 
    }
);

export const resetPasswordSchema = z.object(
    {
        otp: z.string({ message: "Otp is required" }),
        password: z.string({ message: "Password is required" })
            .min(6 , { message: "Password must be at least 6 characters long" })
            .max(50, { message: "Password must be no more than 50 characters long." }),
        confirmPassword: z.string({ message: "Confirm password is required" })
            .max(50, { message: "Password must be no more than 50 characters long." }),
    }
).refine((data) => data.password === data.confirmPassword, 
    {
        message: "Password do not match",
        path: ["confirmPassword"]
    }
);