import AppConfig from '../constants/config';
import { WorkOrderStatus } from '../constants/statuses';

export interface StartWorkOrderParams {
  hasActiveSession: boolean;
  currentStatus: string;
  isWithinRadius: boolean;
  distanceMeters?: number;
  radiusMeters?: number;
}

export interface CompleteWorkOrderParams {
  currentStatus: string;
  hasBeforePhoto: boolean;
  hasAfterPhoto: boolean;
  notes: string | null | undefined;
}

export interface ValidationOutcome {
  allowed: boolean;
  errors: string[];
}

/**
 * Validate whether a work order can be started.
 * Requirements:
 * 1. Active authenticated session.
 * 2. Current status must be 'pending'.
 * 3. Successful GPS validation within configured radius.
 */
export function validateStartWorkOrder(params: StartWorkOrderParams): ValidationOutcome {
  const errors: string[] = [];

  if (!params.hasActiveSession) {
    errors.push('An authenticated engineer session is required to start work.');
  }

  if (params.currentStatus !== WorkOrderStatus.PENDING) {
    errors.push(
      `Only 'pending' work orders can be started. Current status is '${params.currentStatus}'.`
    );
  }

  if (!params.isWithinRadius) {
    const radius = params.radiusMeters || AppConfig.defaultGpsRadiusMeters;
    const distance = params.distanceMeters != null ? `${Math.round(params.distanceMeters)}m` : 'an unknown distance';
    errors.push(
      `GPS proximity verification failed: Engineer is ${distance} away. You must be within ${radius}m of the asset to start work.`
    );
  }

  return {
    allowed: errors.length === 0,
    errors,
  };
}

/**
 * Validate inspection notes length.
 * Required: minimum 10 characters.
 */
export function validateInspectionNotes(notes: string | null | undefined): ValidationOutcome {
  const errors: string[] = [];
  const minLength = AppConfig.minInspectionNotesLength;

  if (!notes || typeof notes !== 'string') {
    errors.push('Inspection notes are required.');
  } else {
    const trimmed = notes.trim();
    if (trimmed.length < minLength) {
      errors.push(`Inspection notes must be at least ${minLength} characters (currently ${trimmed.length}).`);
    }
  }

  return {
    allowed: errors.length === 0,
    errors,
  };
}

/**
 * Validate whether a work order can be completed.
 * Requirements:
 * 1. Current status must be 'in_progress'.
 * 2. Valid BEFORE photo exists.
 * 3. Valid AFTER photo exists.
 * 4. Required inspection notes exist (minimum 10 characters).
 */
export function validateCompleteWorkOrder(params: CompleteWorkOrderParams): ValidationOutcome {
  const errors: string[] = [];

  if (params.currentStatus !== WorkOrderStatus.IN_PROGRESS) {
    errors.push(`Work order must be 'in_progress' to complete. Current status: '${params.currentStatus}'.`);
  }

  if (!params.hasBeforePhoto) {
    errors.push('A valid BEFORE maintenance photograph is required.');
  }

  if (!params.hasAfterPhoto) {
    errors.push('A valid AFTER maintenance photograph is required.');
  }

  const notesValidation = validateInspectionNotes(params.notes);
  if (!notesValidation.allowed) {
    errors.push(...notesValidation.errors);
  }

  return {
    allowed: errors.length === 0,
    errors,
  };
}
