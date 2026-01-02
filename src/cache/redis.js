const { Redis } = require("@upstash/redis");

let redisClient = null;

/**
 * Initialize Redis connection (Upstash REST API)
 */
function initRedis() {
	if (redisClient) {
		return redisClient;
	}

	try {
		const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
		const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

		// Fallback to standard Redis URL if Upstash not configured
		if (!upstashUrl || !upstashToken) {
			console.warn(
				"⚠️  Upstash Redis not configured (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN). Running without cache."
			);
			return null;
		}

		// Create Upstash Redis client (REST-based, no persistent connection needed)
		redisClient = new Redis({
			url: upstashUrl,
			token: upstashToken,
		});

		console.log("✅ Upstash Redis initialized");
		return redisClient;
	} catch (error) {
		console.error("Failed to initialize Redis:", error.message);
		return null;
	}
}

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Parsed data or null
 */
async function getCache(key) {
	try {
		if (!redisClient) {
			return null;
		}

		const data = await redisClient.get(key);

		if (!data) {
			return null;
		}

		// If data is already an object (Upstash sometimes returns parsed JSON), return it
		if (typeof data === "object") {
			return data;
		}

		// If it's a string, try to parse it
		if (typeof data === "string") {
			try {
				return JSON.parse(data);
			} catch {
				// If parsing fails, return the raw string (e.g., for tokens)
				return data;
			}
		}

		return data;
	} catch (error) {
		console.error(`Cache get error for key "${key}":`, error.message);
		return null;
	}
}

/**
 * Set data in cache
 * @param {string} key - Cache key
 * @param {any} value - Data to cache
 * @param {number} ttl - Time to live in seconds (default: 300)
 * @returns {Promise<boolean>} Success status
 */
async function setCache(key, value, ttl = 300) {
	try {
		if (!redisClient) {
			return false;
		}

		// For objects, stringify them; for strings (like tokens), store as-is
		const dataToStore =
			typeof value === "string" ? value : JSON.stringify(value);
		await redisClient.set(key, dataToStore, { ex: ttl });

		return true;
	} catch (error) {
		console.error(`Cache set error for key "${key}":`, error.message);
		return false;
	}
}

/**
 * Delete data from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
async function deleteCache(key) {
	try {
		if (!redisClient) {
			return false;
		}

		await redisClient.del(key);
		return true;
	} catch (error) {
		console.error(`Cache delete error for key "${key}":`, error.message);
		return false;
	}
}

/**
 * Get all keys matching a pattern
 * @param {string} pattern - Key pattern (e.g., "stats:*")
 * @returns {Promise<string[]>} Array of keys
 */
async function getKeys(pattern) {
	try {
		if (!redisClient) {
			return [];
		}

		const keys = await redisClient.keys(pattern);
		return keys;
	} catch (error) {
		console.error(`Cache keys error for pattern "${pattern}":`, error.message);
		return [];
	}
}

/**
 * Check if Redis is connected
 * @returns {boolean}
 */
function isConnected() {
	return redisClient && redisClient.status === "ready";
}

/**
 * Close Redis connection
 */
async function closeRedis() {
	if (redisClient) {
		await redisClient.quit();
		redisClient = null;
	}
}

module.exports = {
	initRedis,
	getCache,
	setCache,
	deleteCache,
	getKeys,
	isConnected,
	closeRedis,
};
