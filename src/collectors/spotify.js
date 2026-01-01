const { getCache } = require("../cache/redis");

const CACHE_KEY_DISCORD = "stats:discord";

/**
 * Get Spotify data from Discord/Lanyard
 * Spotify data is included in the Discord presence data
 */
async function getSpotifyData() {
	try {
		// Spotify data comes from Discord/Lanyard integration
		const discordData = await getCache(CACHE_KEY_DISCORD);

		if (!discordData) {
			return null;
		}

		// Extract and return only Spotify-related information
		if (!discordData.listening_to_spotify || !discordData.spotify) {
			return {
				listening: false,
				current_track: null,
				last_updated: discordData.last_updated,
			};
		}

		return {
			listening: true,
			current_track: {
				track_id: discordData.spotify.track_id,
				song: discordData.spotify.song,
				artist: discordData.spotify.artist,
				album: discordData.spotify.album,
				album_art_url: discordData.spotify.album_art_url,
				timestamps: discordData.spotify.timestamps,
				duration: discordData.spotify.timestamps
					? discordData.spotify.timestamps.end -
					  discordData.spotify.timestamps.start
					: null,
				progress: discordData.spotify.timestamps
					? Date.now() - discordData.spotify.timestamps.start
					: null,
			},
			last_updated: discordData.last_updated,
		};
	} catch (error) {
		console.error("❌ Error getting Spotify data:", error.message);
		return null;
	}
}

module.exports = {
	getSpotifyData,
};
