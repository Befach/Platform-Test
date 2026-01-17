/**
 * Upstash Redis Rate Limiting
 *
 * Production-grade rate limiting using Upstash Redis for distributed environments.
 * Falls back to a no-op limiter in development when environment variables are missing.
 *
 * Features:
 * - Sliding window and fixed window algorithms
 * - Analytics for Upstash dashboard
 * - Configurable prefixes for different endpoints
 * - Graceful fallback for development
 */

import { Ratelimit, type RatelimitConfig } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ============================================================================
// TYPES
// ============================================================================

interface RateLimitResult {
  success: boolean
  reset: number
  remaining: number
  limit: number
}

// ============================================================================
// REDIS CLIENT
// ============================================================================

/**
 * Check if Upstash environment variables are configured
 */
function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  )
}

/**
 * Create Redis client from environment variables
 * Returns null if environment variables are not configured
 */
function createRedisClient(): Redis | null {
  if (!isUpstashConfigured()) {
    return null
  }

  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

// Singleton Redis client
let redisClient: Redis | null | undefined

function getRedisClient(): Redis | null {
  if (redisClient === undefined) {
    redisClient = createRedisClient()
  }
  return redisClient
}

// ============================================================================
// MOCK RATE LIMITER (Development Fallback)
// ============================================================================

/**
 * Mock rate limiter that always allows requests
 * Used when Upstash is not configured (e.g., local development)
 */
class MockRatelimit {
  private readonly limitValue: number

  constructor(config: { limit: number }) {
    this.limitValue = config.limit
  }

  async limit(_identifier: string): Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: number
    pending: Promise<unknown>
  }> {
    return {
      success: true,
      limit: this.limitValue,
      remaining: this.limitValue - 1,
      reset: Date.now() + 60000,
      pending: Promise.resolve(),
    }
  }
}

// ============================================================================
// RATE LIMITER FACTORY
// ============================================================================

interface CreateRateLimiterOptions {
  /** Prefix for Redis keys */
  prefix: string
  /** Number of requests allowed in the window */
  limit: number
  /** Window duration (use Ratelimit.slidingWindow or Ratelimit.fixedWindow) */
  limiter: RatelimitConfig['limiter']
  /** Enable analytics for Upstash dashboard */
  analytics?: boolean
}

/**
 * Create a rate limiter with the given configuration
 * Falls back to a mock limiter if Upstash is not configured
 */
function createRateLimiter(
  options: CreateRateLimiterOptions
): Ratelimit | MockRatelimit {
  const redis = getRedisClient()

  if (!redis) {
    // Return mock limiter for development
    console.warn(
      `[Rate Limiter] Upstash not configured for "${options.prefix}". ` +
        'Using mock limiter that allows all requests. ' +
        'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production.'
    )
    return new MockRatelimit({ limit: options.limit })
  }

  return new Ratelimit({
    redis,
    prefix: options.prefix,
    limiter: options.limiter,
    analytics: options.analytics ?? true,
  })
}

// ============================================================================
// PRE-CONFIGURED RATE LIMITERS
// ============================================================================

/**
 * BlockSuite state synchronization rate limiter
 * 60 requests per minute per identifier (sliding window)
 */
export const blocksuiteState: Ratelimit | MockRatelimit = createRateLimiter({
  prefix: '@blocksuite/state',
  limit: 60,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
})

/**
 * BlockSuite document operations rate limiter
 * 120 requests per minute per identifier (fixed window)
 */
export const blocksuiteDocuments: Ratelimit | MockRatelimit = createRateLimiter({
  prefix: '@blocksuite/docs',
  limit: 120,
  limiter: Ratelimit.fixedWindow(120, '1 m'),
  analytics: true,
})

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check rate limit for a given limiter and identifier
 *
 * @param limiter - The rate limiter to use
 * @param identifier - Unique identifier for the request (user ID, team ID, or IP)
 * @returns Rate limit result with success status and metadata
 */
export async function checkRateLimit(
  limiter: Ratelimit | MockRatelimit,
  identifier: string
): Promise<RateLimitResult> {
  const result = await limiter.limit(identifier)

  return {
    success: result.success,
    reset: result.reset,
    remaining: result.remaining,
    limit: result.limit,
  }
}

/**
 * Get the best identifier for rate limiting
 * Priority: userId > teamId > ip > 'anonymous'
 *
 * @param userId - User ID if authenticated
 * @param teamId - Team ID if available
 * @param ip - Client IP address
 * @returns The best available identifier
 */
export function getRateLimitIdentifier(
  userId?: string,
  teamId?: string,
  ip?: string
): string {
  if (userId) {
    return `user:${userId}`
  }

  if (teamId) {
    return `team:${teamId}`
  }

  if (ip) {
    return `ip:${ip}`
  }

  return 'anonymous'
}

/**
 * Create rate limit headers for HTTP responses
 *
 * @param result - Rate limit result from checkRateLimit
 * @returns Headers object with X-RateLimit-* headers
 */
export function createRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  }

  // Add Retry-After header when rate limited
  if (!result.success) {
    const retryAfterSeconds = Math.ceil((result.reset - Date.now()) / 1000)
    headers['Retry-After'] = Math.max(0, retryAfterSeconds).toString()
  }

  return headers
}

// ============================================================================
// RATE LIMITERS OBJECT (for convenient import)
// ============================================================================

/**
 * Collection of all pre-configured rate limiters
 * Import as: import { rateLimiters } from '@/lib/rate-limiter'
 */
export const rateLimiters = {
  blocksuiteState,
  blocksuiteDocuments,
} as const

// ============================================================================
// EXPORTS
// ============================================================================

export type { RateLimitResult }

// Re-export Ratelimit class for creating custom limiters
export { Ratelimit } from '@upstash/ratelimit'
