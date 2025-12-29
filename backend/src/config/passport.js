// =====================================================
// PASSPORT CONFIGURATION - GOOGLE OAUTH
// =====================================================

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');
const enterpriseLogger = require('../utils/logger');

// Configure Google OAuth Strategy with CSRF protection
// Only initialize if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback';

  enterpriseLogger.info('Initializing Google OAuth Strategy', {
    clientID: process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...',
    callbackURL: callbackURL,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  });

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL,
    passReqToCallback: true, // Enable access to request object for state validation
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      // CSRF Protection: Validate state parameter
      const state = req.query.state;
      const sessionState = req.session?.oauthState;

      enterpriseLogger.info('OAuth state validation attempt', {
        providedState: state,
        sessionState: sessionState,
        sessionId: req.sessionID,
        ip: req.ip,
        sessionExists: !!req.session,
      });

      if (!state || !sessionState || state !== sessionState) {
        enterpriseLogger.warn('OAuth state validation failed', {
          providedState: state,
          sessionState: sessionState,
          sessionId: req.sessionID,
          ip: req.ip,
          sessionExists: !!req.session,
        });
        return done(new Error('Invalid state parameter'), null);
      }

      // Clear the state from session after validation
      delete req.session.oauthState;

      enterpriseLogger.info('Google OAuth callback', {
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        stateValidated: true,
      });

      // Check if user already exists with this Google ID
      let user = await User.findOne({
        where: { providerId: profile.id, authProvider: 'GOOGLE' },
      });

      if (user) {
        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        enterpriseLogger.info('Existing Google user logged in', {
          userId: user.id,
          email: user.email,
        });

        return done(null, user);
      }

      // Check if user exists with same email
      user = await User.findOne({
        where: { email: profile.emails[0].value },
      });

      if (user) {
        // IDEMPOTENT UPSERT (Link Account)
        // If email matches, we update with Google details (Trusted Source)
        user.providerId = profile.id;
        user.authProvider = 'GOOGLE';
        user.fullName = profile.displayName;
        user.lastLoginAt = new Date();
        user.emailVerified = true;

        // Update profile picture in metadata
        const currentMetadata = user.metadata || {};
        if (profile.photos?.[0]?.value) {
          user.metadata = {
            ...currentMetadata,
            profile_picture: profile.photos[0].value,
          };
        }

        await user.save();

        enterpriseLogger.info('Existing user linked/updated with Google', {
          userId: user.id,
          email: user.email,
        });

        return done(null, user);
      }

      // Create new user
      user = await User.create({
        providerId: profile.id,
        email: profile.emails[0].value,
        fullName: profile.displayName,
        authProvider: 'GOOGLE',
        role: 'END_USER',
        status: 'active',
        emailVerified: true,
        lastLoginAt: new Date(),
        metadata: {
          profile_picture: profile.photos?.[0]?.value || null,
        },
      });

      enterpriseLogger.info('New Google user created', {
        userId: user.id,
        email: user.email,
        name: user.fullName,
      });

      return done(null, user);

    } catch (error) {
      enterpriseLogger.error('Google OAuth error', {
        error: error.message,
        googleId: profile.id,
        email: profile.emails[0].value,
      });

      return done(error, null);
    }
  }));
} else {
  enterpriseLogger.warn('Google OAuth not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.');
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
