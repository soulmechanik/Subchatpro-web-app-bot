// utils/rateLimiter.js
const rateLimit = new Map();

const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours window
const MAX_REQUESTS = 5; // Maximum allowed requests per day

// Check if a user has exceeded the limit
const isRateLimited = async (email) => {
  const now = Date.now();
  if (rateLimit.has(email)) {
    const { count, lastRequest } = rateLimit.get(email);

    if (now - lastRequest < RATE_LIMIT_WINDOW) {
      // If within the time window, check request count
      if (count >= MAX_REQUESTS) {
        return true; // Rate-limited
      }
      // Otherwise, increment the count
      rateLimit.set(email, { count: count + 1, lastRequest: now });
    } else {
      // Reset the count after the time window has passed
      rateLimit.set(email, { count: 1, lastRequest: now });
    }
  } else {
    // First request, initialize the count
    rateLimit.set(email, { count: 1, lastRequest: now });
  }

  return false; // No limit reached
};

module.exports = { isRateLimited };
