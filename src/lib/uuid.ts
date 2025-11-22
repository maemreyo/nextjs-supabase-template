import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a proper UUID v4
 * @returns A valid UUID string
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * Validate if a string is a valid UUID
 * @param uuid The string to validate
 * @returns True if valid UUID, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generate a UUID with optional prefix
 * @param prefix Optional prefix to add before the UUID
 * @returns UUID with optional prefix
 */
export function generateUUIDWithPrefix(prefix?: string): string {
  const uuid = uuidv4();
  return prefix ? `${prefix}-${uuid}` : uuid;
}