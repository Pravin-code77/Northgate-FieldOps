import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { addAuditLog } from '../repositories/logRepository';
import { getPrimaryUser, updateBiometricEnrolled } from '../repositories/userRepository';
import { User } from '../models/User';

const ENROLLMENT_KEY = 'fieldops_biometric_enrolled_v1';

export interface AuthStatus {
  hasHardware: boolean;
  isEnrolledInOS: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  isAppEnrolled: boolean;
  primaryEngineer: User | null;
}

export async function checkAuthStatus(): Promise<AuthStatus> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolledInOS = await LocalAuthentication.isEnrolledAsync();
  const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const primaryEngineer = await getPrimaryUser();

  // Check enrollment from SecureStore & user record
  let isAppEnrolled = false;
  try {
    const secureFlag = await SecureStore.getItemAsync(ENROLLMENT_KEY);
    isAppEnrolled = secureFlag === 'true' || primaryEngineer?.biometric_enrolled === 1;
  } catch {
    isAppEnrolled = primaryEngineer?.biometric_enrolled === 1;
  }

  return {
    hasHardware,
    isEnrolledInOS,
    supportedTypes,
    isAppEnrolled,
    primaryEngineer,
  };
}

export async function enrollEngineer(userId: number): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolledInOS = await LocalAuthentication.isEnrolledAsync();

    // Authenticate once to verify and bind enrollment
    if (hasHardware && isEnrolledInOS) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm Biometric Enrollment for FieldOps Mobile',
        fallbackLabel: 'Use Device Passcode',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        return false;
      }
    }

    await SecureStore.setItemAsync(ENROLLMENT_KEY, 'true');
    await updateBiometricEnrolled(userId, true);
    await addAuditLog({
      user_id: userId,
      event_type: 'biometric_enrolled',
      detail: 'Engineer successfully enrolled local biometric authentication.',
    });
    return true;
  } catch (error) {
    console.error('[AuthService] Enrollment error:', error);
    return false;
  }
}

export interface AuthenticationResult {
  success: boolean;
  error?: string;
  isCancelled?: boolean;
}

export async function authenticateEngineer(reason: string = 'FieldOps Mobile Access Verification'): Promise<AuthenticationResult> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolledInOS = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware) {
      return {
        success: false,
        error: 'Biometric hardware is not available on this device. Please use supported device hardware.',
      };
    }

    if (!isEnrolledInOS) {
      return {
        success: false,
        error: 'No biometrics or device passcodes are configured in OS Settings. Please set up a screen lock or fingerprint.',
      };
    }

    const authResult = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use Device Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (authResult.success) {
      await addAuditLog({
        user_id: 1,
        event_type: 'login_success',
        detail: 'Engineer authenticated successfully via local biometric/passcode.',
      });
      return { success: true };
    }

    if (authResult.error === 'user_cancel' || authResult.error === 'app_cancel') {
      return { success: false, isCancelled: true, error: 'Authentication cancelled.' };
    }

    await addAuditLog({
      user_id: 1,
      event_type: 'login_failure',
      detail: `Authentication attempt failed: ${authResult.error}`,
    });

    return {
      success: false,
      error: authResult.error ? `Authentication failed: ${authResult.error}` : 'Authentication failed. Please retry.',
    };
  } catch (err: any) {
    console.error('[AuthService] Authentication error:', err);
    return {
      success: false,
      error: err?.message || 'Authentication error occurred.',
    };
  }
}
