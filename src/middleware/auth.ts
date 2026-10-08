import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';

export default async function authenticate(req: Request, res: Response, next: NextFunction) {
  const userId = req.session?.userId;

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  try {
    const user = await User.findById(userId).select('_id email firstName picture');

    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}
