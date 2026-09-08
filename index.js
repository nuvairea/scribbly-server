require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');
const User = require('./models/User');
const Note = require('./models/Note');
const requireAuth = require('./middleware/auth');
const mongoStore = require('connect-mongo').default || require('connect-mongo');
const app = express();
const { rateLimit } = require('express-rate-limit');

app.use(cors({
  origin: [
    'https://scribbly-app.onrender.com',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
  ],
  credentials: true,
}));

app.use(express.json());

app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET || 'scribbly-dev-secret',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: mongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}));

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 5,
  message: { error: 'Too many attempts, please try again after 5 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection failed', err));

app.post('/signup', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });

    req.session.userId = user._id;
    req.session.save((err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to save session' });
      }

      res.status(201).json({
        message: 'Signed up',
        userId: user._id,
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.userId = user._id;

    req.session.save(err => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to save session' });
      }

      res.json({
        message: 'Logged in',
        userId: user._id,
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/logout', requireAuth, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to log out' });
    }

    res.clearCookie('connect.sid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.json({ message: 'Logged out' });
  });
});

app.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('email');

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json({
      email: user.email,
      userId: user._id,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/notes', requireAuth, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.session.userId }).sort({ timestamp: -1 });
    res.json({ notes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/notes', requireAuth, async (req, res) => {
  try {
    const { userId: _clientUserId, _id: _clientId, ...safeBody } = req.body;

    const note = await Note.create({
      ...safeBody,
      userId: req.session.userId,
      id: req.body.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    });

    res.status(201).json({ note });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.put('/notes/:id', requireAuth, async (req, res) => {
  try {
    const { userId: _clientUserId, _id: _clientId, id: _clientNoteId, ...safeBody } = req.body;

    const note = await Note.findOneAndUpdate(
      { userId: req.session.userId, id: req.params.id },
      { $set: { ...safeBody, updatedAt: Date.now() } },
      { new: true }
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

app.patch('/notes/:id', requireAuth, async (req, res) => {
  try {
    const note = await Note.findOne({ userId: req.session.userId, id: req.params.id });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    note.deleted = Boolean(req.body.deleted);
    note.deletedAt = req.body.deleted ? req.body.deletedAt || Date.now() : null;
    note.updatedAt = Date.now();
    await note.save();

    res.json({ note });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.delete('/notes/:id', requireAuth, async (req, res) => {
  try {
    const result = await Note.deleteOne({
      userId: req.session.userId,
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

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});
