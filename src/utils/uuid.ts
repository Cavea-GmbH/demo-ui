/**
 * Generate a UUID v4 (random UUID)
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a shorter ID for providers (can be used as MAC address format)
 * Format: 12 hex characters (like MAC address without colons)
 */
export function generateProviderId(): string {
  return Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('').toUpperCase();
}

