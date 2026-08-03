require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');
const User = require('./models/User');
const Note = require('./models/Note');
const requireAuth = require('./middleware/auth');
const app = express();

app.use(cors({
  origin: 'https://scribbly-app.onrender.com',
  credentials: true,
}));

app.use(express.json());

app.set('trust proxy', 1);

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
  .catch(err => console.error('MongoDB connection failed', err));

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

    req.session.save(err => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to save session' });
      }

      console.log('LOGIN SESSION:', req.session);

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

app.get('/me', requireAuth, async (req, res) => {
  try {
    console.log('ME SESSION:', req.session);

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

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});