// =====================================================
// PASSPORT CONFIGURATION - CANONICAL EMAIL-BASED AUTH
// =====================================================

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');
const enterpriseLogger = require('../utils/logger');

// Email-based Google OAuth (Option A - Canonical)
// Email is primary identity, auth_provider is informational only
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback';

  enterpriseLogger.info('Initializing email-based Google OAuth', {
    callbackURL,
    identityModel: 'email-primary',
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error('Google account does not provide an email'));
          }

          // Email is primary identity - look up by email only
          let user = await User.findOne({ where: { email } });

          if (!user) {
            // Create new user with Google auth
            user = await User.create({
              email,
              fullName: profile.displayName,
              authProvider: 'google',
              role: 'END_USER',
            });

            enterpriseLogger.info('New Google user created', {
              userId: user.id,
              email: user.email,
            });
          } else {
            enterpriseLogger.info('Existing user logged in via Google', {
              userId: user.id,
              email: user.email,
            });
          }

          return done(null, user);
        } catch (err) {
          enterpriseLogger.error('Google OAuth error', {
            error: err.message,
          });
          return done(err);
        }
      }
    )
  );
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
