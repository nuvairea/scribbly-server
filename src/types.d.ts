import 'express-session';
import type { Types } from 'mongoose';

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId;
        email: string;
        firstName: string;
        picture: string;
      };
    }
  }
}
