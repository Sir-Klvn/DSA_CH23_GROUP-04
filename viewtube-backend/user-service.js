// User Account & Session System
// Handles registration, login, JWT sessions, personalization

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('./db');
const { HashTable } = require('./data-structures');

class UserSessionSystem {
  constructor() {
    this.sessions = new HashTable(1000); // token → session
    this.JWT_SECRET = process.env.JWT_SECRET || 'viewtube-super-secret-key-2024-change-in-prod';
    this.JWT_EXPIRY = '7d';
  }

  // Register new user
  async register(email, password, username = null) {
    // Validate input
    if (!email || !password || password.length < 6) {
      throw new Error('Email and password (min 6 chars) required');
    }

    const hashed = await bcrypt.hash(password, 12);

    const userId = `u_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const user = {
      id: userId,
      email,
      username: username || email.split('@')[0],
      password: hashed,
      createdAt: new Date().toISOString(),
      watchHistory: [],
      likedVideos: [],
      subscriptions: [],
      watchLater: [],
      preferences: {},
      sessionCount: 0
    };

    db.updateUser(userId, user); // uses HashTable
    return { userId, message: 'User registered successfully' };
  }

  // Login & JWT generation
  async login(email, password) {
    const user = db.getUserByEmail(email);
    if (!user) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid credentials');

    // Generate JWT
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      iat: Math.floor(Date.now() / 1000)
    };
    const token = jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRY });

    // Track session
    this.sessions.set(token, {
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      ip: 'local', // from req
      userAgent: 'browser' // from req
    });

    user.sessionCount++;
    db.updateUser(user.id, user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        sessionCount: user.sessionCount
      }
    };
  }

  // Verify JWT middleware
  verifyToken(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
      const decoded = jwt.verify(token, this.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  // Get user profile
  getProfile(userId) {
    const user = db.getUser(userId);
    if (!user) throw new Error('User not found');
    return {
      ...user,
      password: undefined, // never return password
      recentHistory: user.watchHistory.slice(-10),
      subscriptionCount: user.subscriptions.length,
      totalWatched: user.watchHistory.length
    };
  }

  // Personalization: get recommendations + preferences
  getPersonalization(userId) {
    const user = db.getUser(userId);
    if (!user) return null;

    const prefs = user.preferences || {};
    const history = user.watchHistory || [];
    
    return {
      recommendations: history.map(id => db.getVideo(id)).filter(Boolean).slice(0, 5),
      preferences: prefs,
      stats: {
        totalVideosWatched: history.length,
        uniqueChannels: new Set(history.map(id => db.getVideo(id)?.channel)).size,
        avgWatchTime: 'N/A' // would compute from timestamps
      }
    };
  }

  // Update preferences (theme, language, etc.)
  updatePreferences(userId, prefs) {
    const user = db.getUser(userId);
    if (!user) throw new Error('User not found');
    user.preferences = { ...user.preferences, ...prefs };
    db.updateUser(userId, user);
    return user.preferences;
  }

  // Logout - invalidate session
  logout(token) {
    this.sessions.delete(token);
  }

  // Get all active sessions for user
  getUserSessions(userId) {
    const sessions = [];
    for (const [token, session] of this.sessions.entries()) {
      if (session.userId === userId) sessions.push({ token: token.slice(0, 8) + '...', ...session });
    }
    return sessions;
  }
}

module.exports = UserSessionSystem;

