const Redis = require("ioredis");

let redisClient = null;

/**
 * Initialize Redis connection
 */
function initRedis() {
	if (redisClient) {
		return redisClient;
	}

	try {
		const redisUrl = process.env.REDIS_URL;

		if (!redisUrl) {
			console.warn("⚠️  REDIS_URL not configured. Running without cache.");
			return null;
		}

		redisClient = new Redis(redisUrl, {
			maxRetriesPerRequest: 3,
			enableReadyCheck: true,
			lazyConnect: false,
			retryStrategy(times) {
				const delay = Math.min(times * 50, 2000);
				return delay;
			},
			reconnectOnError(err) {
				console.error("Redis reconnect error:", err.message);
				return true;
			},
		});

		redisClient.on("connect", () => {
			console.log("✅ Redis connected successfully");
		});

		redisClient.on("error", (err) => {
			console.error("❌ Redis error:", err.message);
		});

		redisClient.on("close", () => {
			console.log("🔌 Redis connection closed");
		});

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

		return JSON.parse(data);
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

		const serialized = JSON.stringify(value);
		await redisClient.setex(key, ttl, serialized);

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
