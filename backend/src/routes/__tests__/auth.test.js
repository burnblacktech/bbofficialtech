/**
 * Integration tests for auth routes
 * POST /api/auth/register, /api/auth/login, /api/auth/refresh
 */

const bcrypt = require('bcryptjs');

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  UserSession: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    enforceConcurrentLimit: jest.fn().mockResolvedValue(true),
    findActiveSessions: jest.fn().mockResolvedValue([]),
    revokeAllSessions: jest.fn().mockResolvedValue(true),
  },
  PasswordResetToken: {
    validateToken: jest.fn(),
    createResetToken: jest.fn(),
    markAsUsed: jest.fn(),
  },
}));

jest.mock('../../services/core/AuditService', () => ({
  logAuthEvent: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../services/integration/EmailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../middleware/auditLogger', () => ({
  auditAuthEvents: () => (_req, _res, next) => next(),
  auditFailedAuth: () => (_req, _res, next) => next(),
}));

jest.mock('../../middleware/progressiveRateLimit', () => ({
  progressiveRateLimit: () => (_req, _res, next) => next(),
  recordFailedAttempt: (_req, _res, next) => next(),
  clearFailedAttempts: (_req, _res, next) => next(),
}));

jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { userId: 'user-1', email: 'test@example.com', role: 'END_USER' };
    next();
  },
  authRateLimit: (_req, _res, next) => next(),
}));

jest.mock('../../config/passport', () => ({}));

jest.mock('../../services/utils/DeviceDetectionService', () => ({
  parseDeviceInfo: jest.fn().mockReturnValue({ deviceType: 'desktop', deviceName: 'Chrome', browser: 'Chrome', os: 'macOS' }),
}));

jest.mock('../../services/common/PANVerificationService', () => ({
  verifyPAN: jest.fn(),
}));

jest.mock('../../services/common/AadhaarVerificationService', () => ({
  verifyFromPDF: jest.fn(),
  generateOTP: jest.fn(),
  submitOTP: jest.fn(),
}));

// ── Setup ────────────────────────────────────────────────────────────────────

const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');
const { User, UserSession } = require('../../models');

process.env.JWT_SECRET = 'test-secret-key';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  // Minimal session mock for OAuth routes
  app.use((req, _res, next) => { req.session = {}; next(); });
  app.use('/api/auth', require('../auth'));
  app.use((err, _req, res, _next) => {
    res.status(err.statusCode || err.status || 500).json({ success: false, error: err.message });
  });
  return app;
}

const app = buildApp();

// ── Fixtures ─────────────────────────────────────────────────────────────────

const PASSWORD_HASH = bcrypt.hashSync('Password123', 10);

const EXISTING_USER = {
  id: 'user-1',
  email: 'test@example.com',
  fullName: 'Test User',
  passwordHash: PASSWORD_HASH,
  role: 'END_USER',
  status: 'active',
  authProvider: 'local',
  phone: null,
  panNumber: null,
  panVerified: false,
  caFirmId: null,
  save: jest.fn().mockResolvedValue(true),
  update: jest.fn().mockResolvedValue(true),
};

// ── Tests: POST /api/auth/register ──────────────────────────────────────────

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should register a new user successfully', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      id: 'new-user-1',
      email: 'new@example.com',
      fullName: 'New User',
      role: 'END_USER',
      status: 'active',
      createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'Password123', fullName: 'New User' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Registration successful');
  });

  it('should return 200 (no reveal) for duplicate email', async () => {
    User.findOne.mockResolvedValue(EXISTING_USER);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'Password123', fullName: 'Dup User' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeUndefined(); // no user object leaked
  });

  it('should return 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@x.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ── Tests: POST /api/auth/login ─────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should login successfully with correct credentials', async () => {
    User.findOne.mockResolvedValue(EXISTING_USER);
    UserSession.create.mockResolvedValue({ id: 'session-1' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('should return 401 for wrong password', async () => {
    User.findOne.mockResolvedValue(EXISTING_USER);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'WrongPass' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 for non-existent user', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password123' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ── Tests: POST /api/auth/refresh ───────────────────────────────────────────

describe('POST /api/auth/refresh', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 when no refresh token cookie is provided', async () => {
    const res = await request(app).post('/api/auth/refresh').send();

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should refresh token with valid session cookie', async () => {
    const rawToken = 'valid-refresh-token';
    const hashed = await bcrypt.hash(rawToken, 10);

    UserSession.findByPk.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      refreshTokenHash: hashed,
      revoked: false,
      expiresAt: new Date(Date.now() + 86400000),
      update: jest.fn().mockResolvedValue(true),
    });

    User.findByPk.mockResolvedValue(EXISTING_USER);

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refreshToken=${rawToken}`, 'sessionId=session-1']);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
  });
});
