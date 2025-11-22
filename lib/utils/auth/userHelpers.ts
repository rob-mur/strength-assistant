import { storageManager } from '../../data/StorageManager';

/**
 * Get the current user ID from the auth backend
 * @returns User ID string or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const authBackend = storageManager.getAuthBackend();
    const user = await authBackend.getCurrentUser();
    return user?.id || null;
  } catch (error) {
    console.warn('Failed to get current user ID:', error);
    return null;
  }
}

/**
 * Require authentication and return user ID
 * @throws Error if user is not authenticated
 * @returns User ID string
 */
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
}

/**
 * Helper to generate a UUID for client-side ID generation
 * Uses crypto.randomUUID if available, otherwise falls back to a simple implementation
 * @returns UUID string
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback UUID generation for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}