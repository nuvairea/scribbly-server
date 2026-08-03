require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Note = require('./models/Note');
const requireAuth = require('./middleware/auth');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: 'https://scribbly-app.onrender.com',
  credentials: true,
}));

app.use(express.json());

const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection failed', err));

app.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('email');
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({ email: user.email, userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exist' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });

    res.status(201).json({ message: 'Account created', userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
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
    res.json({ message: 'Logged in', userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/notes', requireAuth, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.session.userId });
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/notes', requireAuth, async (req, res) => {
  try {
    const { title, body, color } = req.body;
    const note = await Note.create({
      userId: req.session.userId,
      title,
      body,
      color,
    });
    res.status(201).json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.put('/notes/:id', requireAuth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.session.userId });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const { title, body, color } = req.body;
    if (title !== undefined) note.title = title;
    if (body !== undefined) note.body = body;
    if (color !== undefined) note.color = color;
    note.updatedAt = Date.now();

    await note.save();
    res.json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.delete('/notes/:id', requireAuth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.session.userId });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    note.deleted = true;
    note.deletedAt = Date.now();
    await note.save();

    res.json({ message: 'Note moved to trash' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});