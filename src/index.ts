import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import cors from 'cors';
import MongoStore from 'connect-mongo';
import { rateLimit } from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';
import User from './models/User.js';
import Note from './models/Note.js';
import authenticate from './middleware/auth.js';

const isProd = process.env.NODE_ENV === 'production';
const { MONGODB_URI, GOOGLE_CLIENT_ID, SESSION_SECRET } = process.env;

if (!MONGODB_URI) throw new Error('MONGODB_URI must be configured');
if (!GOOGLE_CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID must be configured');
if (isProd && !SESSION_SECRET) throw new Error('SESSION_SECRET must be configured in production');

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const app = express();

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? ('none' as const) : ('lax' as const),
};

app.use(cors({
  origin: [
    'https://scribbly-app.onrender.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
  ],
  credentials: true,
}));

app.use(express.json());

app.set('trust proxy', 1);

app.use(session({
  secret: SESSION_SECRET || 'local-development-only-secret',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: MongoStore.create({ mongoUrl: MONGODB_URI }),
  cookie: {
    ...cookieOptions,
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  },
}));

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 10,
  message: { error: 'Too many attempts, please try again after 5 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection failed', err));

// ---------- auth ----------

app.post('/auth/google', authLimiter, async (req: Request, res: Response) => {
  const credential = req.body?.credential;

  if (typeof credential !== 'string' || !credential) {
    return res.status(400).json({ error: 'Missing Google credential' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    console.error('Google token verification failed', err);
    return res.status(401).json({ error: 'Invalid Google token' });
  }

  if (!payload?.sub || !payload.email || !payload.email_verified) {
    return res.status(401).json({ error: 'Google account email is not verified' });
  }

  try {
    const user = await User.findOneAndUpdate(
      { googleId: payload.sub },
      {
        $set: {
          email: payload.email.toLowerCase(),
          firstName: payload.given_name ?? '',
          picture: payload.picture ?? '',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    req.session.regenerate((err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to create session' });
      }

      req.session.userId = String(user._id);
      req.session.save((err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Failed to save session' });
        }

        res.json({
          userId: user._id,
          email: user.email,
          firstName: user.firstName,
          picture: user.picture,
        });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/logout', authenticate, (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to log out' });
    }

    res.clearCookie('connect.sid', cookieOptions);
    res.json({ success: true, message: 'Logged out' });
  });
});

app.get('/me', authenticate, (req: Request, res: Response) => {
  const user = req.user!;
  res.json({
    userId: user._id,
    email: user.email,
    firstName: user.firstName,
    picture: user.picture,
  });
});

app.delete('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    await Note.deleteMany({ userId: user._id });
    await User.deleteOne({ _id: user._id });

    req.session.destroy((err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Account deleted, but failed to end session' });
      }

      res.clearCookie('connect.sid', cookieOptions);
      res.json({ success: true, message: 'Account deleted' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Account deletion failed' });
  }
});

// ---------- notes ----------

app.get('/notes', authenticate, async (req: Request, res: Response) => {
  try {
    const notes = await Note.find({ userId: req.user!._id }).sort({ timestamp: -1 });
    res.json({ notes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/notes', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId: _clientUserId, _id: _clientId, ...safeBody } = req.body;

    const note = await Note.create({
      ...safeBody,
      userId: req.user!._id,
      id: req.body.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    });

    res.status(201).json({ note });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.put('/notes/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId: _clientUserId, _id: _clientId, id: _clientNoteId, ...safeBody } = req.body;

    const note = await Note.findOneAndUpdate(
      { userId: req.user!._id, id: req.params.id },
      { $set: { ...safeBody, updatedAt: Date.now() } },
      { new: true },
    );

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ note });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.patch('/notes/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const note = await Note.findOne({ userId: req.user!._id, id: req.params.id });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    note.deleted = Boolean(req.body.deleted);
    note.deletedAt = req.body.deleted ? req.body.deletedAt || Date.now() : null;
    note.updatedAt = new Date();
    await note.save();

    res.json({ note });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.delete('/notes/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await Note.deleteOne({
      userId: req.user!._id,
      id: req.params.id,
      deleted: true,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Deleted note not found' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
