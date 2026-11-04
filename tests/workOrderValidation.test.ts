import {
  validateCompleteWorkOrder,
  validateInspectionNotes,
  validateStartWorkOrder,
} from '../src/validation/workOrderValidation';
import { WorkOrderStatus } from '../src/constants/statuses';

describe('Work Order Validation Rules', () => {
  describe('validateStartWorkOrder', () => {
    test('rejects start if session is not authenticated', () => {
      const res = validateStartWorkOrder({
        hasActiveSession: false,
        currentStatus: WorkOrderStatus.PENDING,
        isWithinRadius: true,
      });
      expect(res.allowed).toBe(false);
      expect(res.errors[0]).toMatch(/authenticated engineer session is required/i);
    });

    test('rejects start if work order is not in pending status', () => {
      const res = validateStartWorkOrder({
        hasActiveSession: true,
        currentStatus: WorkOrderStatus.IN_PROGRESS,
        isWithinRadius: true,
      });
      expect(res.allowed).toBe(false);
      expect(res.errors[0]).toMatch(/only 'pending' work orders can be started/i);
    });

    test('rejects start if outside configured GPS radius', () => {
      const res = validateStartWorkOrder({
        hasActiveSession: true,
        currentStatus: WorkOrderStatus.PENDING,
        isWithinRadius: false,
        distanceMeters: 450,
        radiusMeters: 100,
      });
      expect(res.allowed).toBe(false);
      expect(res.errors[0]).toMatch(/GPS proximity verification failed/i);
      expect(res.errors[0]).toContain('450m');
    });

    test('allows start when session is authenticated, status is pending, and within GPS radius', () => {
      const res = validateStartWorkOrder({
        hasActiveSession: true,
        currentStatus: WorkOrderStatus.PENDING,
        isWithinRadius: true,
        distanceMeters: 12,
        radiusMeters: 100,
      });
      expect(res.allowed).toBe(true);
      expect(res.errors).toHaveLength(0);
    });
  });

  describe('validateInspectionNotes', () => {
    test('rejects empty or null notes', () => {
      expect(validateInspectionNotes(null).allowed).toBe(false);
      expect(validateInspectionNotes('').allowed).toBe(false);
      expect(validateInspectionNotes('   ').allowed).toBe(false);
    });

    test('rejects notes shorter than 10 characters', () => {
      const res = validateInspectionNotes('Done OK');
      expect(res.allowed).toBe(false);
      expect(res.errors[0]).toMatch(/at least 10 characters/i);
    });

    test('accepts notes with 10 or more characters', () => {
      const res = validateInspectionNotes('Bearing lubricated with Polyrex EM.');
      expect(res.allowed).toBe(true);
      expect(res.errors).toHaveLength(0);
    });
  });

  describe('validateCompleteWorkOrder', () => {
    test('rejects completion if status is not in_progress', () => {
      const res = validateCompleteWorkOrder({
        currentStatus: WorkOrderStatus.PENDING,
        hasBeforePhoto: true,
        hasAfterPhoto: true,
        notes: 'Sufficient inspection notes provided.',
      });
      expect(res.allowed).toBe(false);
      expect(res.errors[0]).toMatch(/must be 'in_progress' to complete/i);
    });

    test('rejects completion if BEFORE photo is missing', () => {
      const res = validateCompleteWorkOrder({
        currentStatus: WorkOrderStatus.IN_PROGRESS,
        hasBeforePhoto: false,
        hasAfterPhoto: true,
        notes: 'Sufficient inspection notes provided.',
      });
      expect(res.allowed).toBe(false);
      expect(res.errors[0]).toMatch(/BEFORE maintenance photograph is required/i);
    });

    test('rejects completion if AFTER photo is missing', () => {
      const res = validateCompleteWorkOrder({
        currentStatus: WorkOrderStatus.IN_PROGRESS,
        hasBeforePhoto: true,
        hasAfterPhoto: false,
        notes: 'Sufficient inspection notes provided.',
      });
      expect(res.allowed).toBe(false);
      expect(res.errors[0]).toMatch(/AFTER maintenance photograph is required/i);
    });

    test('rejects completion if notes are under 10 characters', () => {
      const res = validateCompleteWorkOrder({
        currentStatus: WorkOrderStatus.IN_PROGRESS,
        hasBeforePhoto: true,
        hasAfterPhoto: true,
        notes: 'Fixed it',
      });
      expect(res.allowed).toBe(false);
      expect(res.errors[0]).toMatch(/at least 10 characters/i);
    });

    test('allows completion when all criteria (BEFORE photo, AFTER photo, valid notes, in_progress) are met', () => {
      const res = validateCompleteWorkOrder({
        currentStatus: WorkOrderStatus.IN_PROGRESS,
        hasBeforePhoto: true,
        hasAfterPhoto: true,
        notes: 'Disassembled pump casing, replaced seal rings, reassembled and tested pressure.',
      });
      expect(res.allowed).toBe(true);
      expect(res.errors).toHaveLength(0);
    });
  });
});
