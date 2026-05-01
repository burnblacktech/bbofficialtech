/**
 * Unit tests for SubmissionStateMachine
 * S19 - Constitutional Authority for Lifecycle Transitions
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../services/itr/FilingSnapshotService', () => ({
  createSnapshot: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../config/database', () => ({
  sequelize: {
    transaction: jest.fn((cb) => cb({ /* mock transaction */ })),
  },
}));

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// ── Setup ────────────────────────────────────────────────────────────────────

const STATES = require('../SubmissionStates');
const stateMachine = require('../SubmissionStateMachine');
const FilingSnapshotService = require('../../services/itr/FilingSnapshotService');

function makeFiling(overrides = {}) {
  return {
    id: 'filing-1',
    createdBy: 'user-1',
    userId: 'user-1',
    caFirmId: null,
    lifecycleState: STATES.DRAFT,
    taxLiability: 0,
    jsonPayload: {},
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('SubmissionStateMachine', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── assertTransition ───────────────────────────────────────────────────

  describe('assertTransition', () => {
    it('allows valid transition DRAFT → READY_FOR_SUBMISSION', () => {
      expect(() => stateMachine.assertTransition(STATES.DRAFT, STATES.READY_FOR_SUBMISSION)).not.toThrow();
    });

    it('throws on invalid transition DRAFT → ERI_SUCCESS', () => {
      expect(() => stateMachine.assertTransition(STATES.DRAFT, STATES.ERI_SUCCESS)).toThrow('Illegal state transition');
    });

    it('allows same-state transition (idempotency)', () => {
      expect(() => stateMachine.assertTransition(STATES.DRAFT, STATES.DRAFT)).not.toThrow();
    });

    it('throws with INVALID_TRANSITION code', () => {
      try {
        stateMachine.assertTransition(STATES.ERI_SUCCESS, STATES.DRAFT);
        fail('should have thrown');
      } catch (e) {
        expect(e.statusCode || e.status).toBe(400);
        expect(e.code).toBe('INVALID_TRANSITION');
      }
    });
  });

  // ── validateActorAuthority ─────────────────────────────────────────────

  describe('validateActorAuthority', () => {
    it('END_USER can transition their own filing to READY_FOR_SUBMISSION', () => {
      const filing = makeFiling();
      expect(() =>
        stateMachine.validateActorAuthority(filing, STATES.READY_FOR_SUBMISSION, {
          userId: 'user-1',
          role: 'END_USER',
        }),
      ).not.toThrow();
    });

    it('throws 403 when unauthorized actor attempts transition', () => {
      const filing = makeFiling();
      try {
        stateMachine.validateActorAuthority(filing, STATES.READY_FOR_SUBMISSION, {
          userId: 'other-user',
          role: 'END_USER',
        });
        fail('should have thrown');
      } catch (e) {
        expect(e.statusCode || e.status).toBe(403);
        expect(e.code).toBe('UNAUTHORIZED_TRANSITION');
      }
    });

    it('throws when actorContext is missing', () => {
      const filing = makeFiling();
      expect(() => stateMachine.validateActorAuthority(filing, STATES.DRAFT, null)).toThrow(
        'Actor context required',
      );
    });
  });

  // ── validatePaymentGate ────────────────────────────────────────────────

  describe('validatePaymentGate', () => {
    it('passes when no tax liability', () => {
      const filing = makeFiling({ taxLiability: 0 });
      expect(() => stateMachine.validatePaymentGate(filing, STATES.READY_FOR_SUBMISSION)).not.toThrow();
    });

    it('throws when tax liability is unpaid', () => {
      const filing = makeFiling({ taxLiability: 50000, jsonPayload: {} });
      try {
        stateMachine.validatePaymentGate(filing, STATES.READY_FOR_SUBMISSION);
        fail('should have thrown');
      } catch (e) {
        expect(e.statusCode || e.status).toBe(403);
        expect(e.code).toBe('PAYMENT_GATE_NOT_CLEARED');
      }
    });

    it('skips payment check for states that do not require it', () => {
      const filing = makeFiling({ taxLiability: 50000 });
      expect(() => stateMachine.validatePaymentGate(filing, STATES.REVIEW_PENDING)).not.toThrow();
    });
  });

  // ── transition (integration) ───────────────────────────────────────────

  describe('transition', () => {
    it('updates lifecycleState and saves inside transaction', async () => {
      const filing = makeFiling();
      await stateMachine.transition(filing, STATES.READY_FOR_SUBMISSION, {
        userId: 'user-1',
        role: 'END_USER',
      });

      expect(filing.lifecycleState).toBe(STATES.READY_FOR_SUBMISSION);
      expect(filing.save).toHaveBeenCalled();
      expect(FilingSnapshotService.createSnapshot).toHaveBeenCalledWith(
        'filing-1',
        'payment_gate_cleared',
        'user-1',
        expect.objectContaining({}),
      );
    });

    it('skips snapshot on same-state transition', async () => {
      const filing = makeFiling();
      await stateMachine.transition(filing, STATES.DRAFT, { userId: 'user-1', role: 'END_USER' });

      expect(FilingSnapshotService.createSnapshot).not.toHaveBeenCalled();
      expect(filing.save).toHaveBeenCalled();
    });
  });
});
