const axios = require("axios");
const { setCache, getCache } = require("../cache/redis");

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";
const CACHE_KEY = "stats:spotify";
const CACHE_KEY_TOKEN = "stats:spotify:token";
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 300;
const TOKEN_TTL = 3500; // 58 minutes (tokens expire in 1 hour)

/**
 * Get Spotify access token using refresh token
 * Tokens are cached to avoid unnecessary API calls
 */
async function getAccessToken() {
	try {
		// Check cache first
		const cachedToken = await getCache(CACHE_KEY_TOKEN);
		if (cachedToken) {
			return cachedToken;
		}

		const clientId = process.env.SPOTIFY_CLIENT_ID;
		const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
		const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

		if (!clientId || !clientSecret || !refreshToken) {
			console.warn(
				"⚠️  Spotify credentials not configured (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN)"
			);
			return null;
		}

		// Create Basic Auth header
		const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
			"base64"
		);

		const response = await axios.post(
			SPOTIFY_TOKEN_URL,
			new URLSearchParams({
				grant_type: "refresh_token",
				refresh_token: refreshToken,
			}),
			{
				headers: {
					Authorization: `Basic ${credentials}`,
					"Content-Type": "application/x-www-form-urlencoded",
				},
				timeout: 10000,
			}
		);

		const accessToken = response.data.access_token;

		// Cache the token (expires in 1 hour)
		await setCache(CACHE_KEY_TOKEN, accessToken, TOKEN_TTL);

		return accessToken;
	} catch (error) {
		console.error("❌ Error getting Spotify access token:", error.message);
		return null;
	}
}

/**
 * Fetch currently playing track from Spotify
 */
async function fetchSpotifyData() {
	try {
		console.log("🔄 Fetching Spotify currently playing...");

		const accessToken = await getAccessToken();
		if (!accessToken) {
			return null;
		}

		const response = await axios.get(
			`${SPOTIFY_API_URL}/me/player/currently-playing`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
				timeout: 10000,
				validateStatus: (status) => status === 200 || status === 204,
			}
		);

		// 204 means no track is currently playing
		if (response.status === 204 || !response.data) {
			const offlineData = {
				is_playing: false,
				current_track: null,
				last_updated: new Date().toISOString(),
			};

			await setCache(CACHE_KEY, offlineData, CACHE_TTL);
			console.log("✅ Spotify: Not playing");
			return offlineData;
		}

		const data = response.data;
		const track = data.item;

		const normalized = {
			is_playing: data.is_playing,
			current_track: track
				? {
						id: track.id,
						name: track.name,
						artists: track.artists.map((artist) => ({
							name: artist.name,
							id: artist.id,
							url: artist.external_urls.spotify,
						})),
						artist_names: track.artists.map((a) => a.name).join(", "),
						album: {
							name: track.album.name,
							id: track.album.id,
							url: track.album.external_urls.spotify,
							images: track.album.images,
							album_art_url: track.album.images[0]?.url || null,
						},
						duration_ms: track.duration_ms,
						progress_ms: data.progress_ms,
						url: track.external_urls.spotify,
						preview_url: track.preview_url,
						explicit: track.explicit,
						popularity: track.popularity,
				  }
				: null,
			timestamp: data.timestamp,
			context: data.context
				? {
						type: data.context.type, // playlist, album, artist
						url: data.context.external_urls?.spotify || null,
				  }
				: null,
			last_updated: new Date().toISOString(),
		};

		// Cache the data
		await setCache(CACHE_KEY, normalized, CACHE_TTL);

		console.log(
			`✅ Spotify: ${normalized.is_playing ? "Playing" : "Paused"} - ${
				track?.name || "Unknown"
			}`
		);
		return normalized;
	} catch (error) {
		console.error("❌ Error fetching Spotify data:", error.message);

		// Return cached data if available
		const cached = await getCache(CACHE_KEY);
		if (cached) {
			console.log("📦 Returning cached Spotify data");
			return cached;
		}

		return null;
	}
}

/**
 * Get Spotify data (from cache or fetch if needed)
 */
async function getSpotifyData() {
	const cached = await getCache(CACHE_KEY);

	if (cached) {
		return cached;
	}

	return await fetchSpotifyData();
}

module.exports = {
	fetchSpotifyData,
	getSpotifyData,
	CACHE_KEY,
};
