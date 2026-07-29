require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('./models/User.js');

const app = express();
app.use(express.json());

const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection failed', err));

app.post('/signup', async (req, res) => {
  try {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({error: 'Email and password are required'});
  }

  const existingUser = await User.findOne({ email });
  if (existingUser){
    return res.status(409).json({error: 'An account with this email already exist'});
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

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});