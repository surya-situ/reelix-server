import { JwtPayload } from "jsonwebtoken";

interface JwtPayload {
  id: string;
  email: string;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload; 
    }
  }
}