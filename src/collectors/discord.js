const axios = require("axios");
const { setCache, getCache } = require("../cache/redis");

const LANYARD_API = "https://api.lanyard.rest/v1/users";
const CACHE_KEY = "stats:discord";
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 300;

/**
 * Fetch Discord presence data from Lanyard API
 * Includes Discord status, activities, and Spotify data
 */
async function fetchDiscordData() {
	try {
		const userId = process.env.DISCORD_USER_ID;

		if (!userId) {
			console.warn("⚠️  DISCORD_USER_ID not configured");
			return null;
		}

		console.log("🔄 Fetching Discord presence from Lanyard...");

		const response = await axios.get(`${LANYARD_API}/${userId}`, {
			timeout: 10000,
			headers: {
				"User-Agent": "Personal-Stats-API/1.0",
			},
		});

		if (!response.data || !response.data.success) {
			throw new Error("Invalid response from Lanyard API");
		}

		const data = response.data.data;

		// Normalize the data structure
		const normalized = {
			discord_user: {
				id: data.discord_user.id,
				username: data.discord_user.username,
				discriminator: data.discord_user.discriminator,
				avatar: data.discord_user.avatar,
				bot: data.discord_user.bot,
				global_name: data.discord_user.global_name || null,
			},
			discord_status: data.discord_status, // online, idle, dnd, offline
			active_on_discord_mobile: data.active_on_discord_mobile,
			active_on_discord_desktop: data.active_on_discord_desktop,
			active_on_discord_web: data.active_on_discord_web,
			listening_to_spotify: data.listening_to_spotify,
			spotify: data.spotify
				? {
						track_id: data.spotify.track_id,
						timestamps: data.spotify.timestamps,
						song: data.spotify.song,
						artist: data.spotify.artist,
						album_art_url: data.spotify.album_art_url,
						album: data.spotify.album,
				  }
				: null,
			activities: data.activities.map((activity) => ({
				id: activity.id,
				name: activity.name,
				type: activity.type,
				state: activity.state || null,
				details: activity.details || null,
				emoji: activity.emoji || null,
				created_at: activity.created_at,
				timestamps: activity.timestamps || null,
				application_id: activity.application_id || null,
				assets: activity.assets || null,
			})),
			kv: data.kv || {},
			last_updated: new Date().toISOString(),
		};

		// Cache the data
		await setCache(CACHE_KEY, normalized, CACHE_TTL);

		console.log("✅ Discord presence data updated");
		return normalized;
	} catch (error) {
		console.error("❌ Error fetching Discord data:", error.message);

		// Return cached data if available
		const cached = await getCache(CACHE_KEY);
		if (cached) {
			console.log("📦 Returning cached Discord data");
			return cached;
		}

		return null;
	}
}

/**
 * Get Discord presence data (from cache or fetch if needed)
 */
async function getDiscordData() {
	const cached = await getCache(CACHE_KEY);

	if (cached) {
		return cached;
	}

	return await fetchDiscordData();
}

module.exports = {
	fetchDiscordData,
	getDiscordData,
	CACHE_KEY,
};
