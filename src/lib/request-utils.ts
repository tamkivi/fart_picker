/**
 * Extracts and validates the client IP from the X-Forwarded-For header.
 * The header can contain a comma-separated list; we take the first entry.
 * Returns undefined if the value is missing or not a valid IP address.
 */
export function sanitizeIpAddress(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const first = raw.split(",")[0].trim();
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^[0-9a-fA-F:]{2,45}$/;
  if (ipv4.test(first) || ipv6.test(first)) {
    return first;
  }
  return undefined;
}

// In-memory rate limiter. Note: each serverless instance has its own memory,
// so this is best-effort protection rather than a hard guarantee across all instances.
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Returns true if the request is allowed, false if it should be rejected.
 * @param key    Unique key (e.g. IP address)
 * @param limit  Max number of requests allowed within the window
 * @param windowMs  Window duration in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}
