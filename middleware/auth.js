const mongoose = require('mongoose');
const User = require('../models/User');

async function authenticate(req, res, next) {
  const userId = req.session?.userId;

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  try {
    const user = await User.findById(userId).select('_id email');

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

module.exports = authenticate;
