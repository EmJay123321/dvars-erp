const TEMP_PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
const TEMP_PASSWORD_LENGTH = 8;

/**
 * Generate a random temporary access code for newly created VA accounts.
 * The code is human-readable (ambiguous characters excluded).
 */
export function generateTempPassword(): string {
  let code = "";
  const arr = new Uint8Array(TEMP_PASSWORD_LENGTH);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < TEMP_PASSWORD_LENGTH; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
    code += TEMP_PASSWORD_CHARS[arr[i] % TEMP_PASSWORD_CHARS.length];
  }
  return code;
}

/**
 * Hash a password for storage. In Phase 0 (mock) this is a plain-text passthrough.
 * When the backend is introduced, swap this for bcrypt / argon2.
 */
// TODO(backend): replace with bcrypt.hash(password, 12) or similar
export function hashPassword(password: string): string {
  return password;
}

/**
 * Verify a password against a stored hash. In Phase 0 this is plain-text equality.
 * TODO(backend): replace with bcrypt.compare(password, hash)
 */
export function verifyPassword(password: string, hash: string): boolean {
  return password === hash;
}
