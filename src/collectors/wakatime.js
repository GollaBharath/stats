const axios = require("axios");
const { setCache, getCache } = require("../cache/redis");

const WAKATIME_API = "https://wakatime.com/api/v1";
const CACHE_KEY = "stats:wakatime";
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 300;

/**
 * Fetch WakaTime coding statistics
 * Requires WakaTime API key
 */
async function fetchWakaTimeData() {
	try {
		const apiKey = process.env.WAKATIME_API_KEY;

		if (!apiKey) {
			console.warn("⚠️  WAKATIME_API_KEY not configured");
			return null;
		}

		console.log("🔄 Fetching WakaTime data...");

		const headers = {
			Authorization: `Bearer ${apiKey}`,
			"User-Agent": "Personal-Stats-API/1.0",
		};

		// Fetch multiple endpoints in parallel
		const [userResponse, statsResponse, summariesResponse, allTimeResponse] =
			await Promise.all([
				// User info
				axios.get(`${WAKATIME_API}/users/current`, {
					headers,
					timeout: 10000,
				}),
				// Stats for last 7 days
				axios.get(`${WAKATIME_API}/users/current/stats/last_7_days`, {
					headers,
					timeout: 10000,
				}),
				// Daily summaries (last 7 days)
				axios.get(`${WAKATIME_API}/users/current/summaries`, {
					headers,
					params: {
						start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
							.toISOString()
							.split("T")[0],
						end: new Date().toISOString().split("T")[0],
					},
					timeout: 10000,
				}),
				// All time since today
				axios.get(`${WAKATIME_API}/users/current/all_time_since_today`, {
					headers,
					timeout: 10000,
				}),
			]);

		const userData = userResponse.data.data;
		const statsData = statsResponse.data.data;
		const summariesData = summariesResponse.data.data;
		const allTimeData = allTimeResponse.data.data;

		// Normalize the data
		const normalized = {
			user: {
				id: userData.id,
				username: userData.username,
				display_name: userData.display_name,
				email: userData.email,
				photo: userData.photo,
				website: userData.website,
				location: userData.location,
				created_at: userData.created_at,
				last_heartbeat_at: userData.last_heartbeat_at,
				last_plugin_name: userData.last_plugin_name,
				last_project: userData.last_project,
			},
			stats_last_7_days: {
				total_seconds: statsData.total_seconds,
				daily_average: statsData.daily_average,
				human_readable_total: statsData.human_readable_total,
				human_readable_daily_average: statsData.human_readable_daily_average,
				languages:
					statsData.languages?.slice(0, 10).map((lang) => ({
						name: lang.name,
						total_seconds: lang.total_seconds,
						percent: lang.percent,
						digital: lang.digital,
						text: lang.text,
					})) || [],
				editors:
					statsData.editors?.map((editor) => ({
						name: editor.name,
						total_seconds: editor.total_seconds,
						percent: editor.percent,
						digital: editor.digital,
						text: editor.text,
					})) || [],
				operating_systems:
					statsData.operating_systems?.map((os) => ({
						name: os.name,
						total_seconds: os.total_seconds,
						percent: os.percent,
						digital: os.digital,
						text: os.text,
					})) || [],
				categories:
					statsData.categories?.map((cat) => ({
						name: cat.name,
						total_seconds: cat.total_seconds,
						percent: cat.percent,
						digital: cat.digital,
						text: cat.text,
					})) || [],
				projects:
					statsData.projects?.slice(0, 10).map((proj) => ({
						name: proj.name,
						total_seconds: proj.total_seconds,
						percent: proj.percent,
						digital: proj.digital,
						text: proj.text,
					})) || [],
				best_day: statsData.best_day
					? {
							date: statsData.best_day.date,
							total_seconds: statsData.best_day.total_seconds,
							text: statsData.best_day.text,
					  }
					: null,
			},
			all_time: {
				total_seconds: allTimeData.total_seconds,
				text: allTimeData.text,
				is_up_to_date: allTimeData.is_up_to_date,
			},
			daily_summaries: summariesData.map((day) => ({
				date: day.range.date,
				total_seconds: day.grand_total.total_seconds,
				text: day.grand_total.text,
				digital: day.grand_total.digital,
			})),
			last_updated: new Date().toISOString(),
		};

		// Cache the data
		await setCache(CACHE_KEY, normalized, CACHE_TTL);

		console.log("✅ WakaTime data updated");
		return normalized;
	} catch (error) {
		console.error("❌ Error fetching WakaTime data:", error.message);

		if (error.response) {
			console.error("Response status:", error.response.status);
			if (error.response.status === 401) {
				console.error("Invalid WakaTime API key");
			}
		}

		// Return cached data if available
		const cached = await getCache(CACHE_KEY);
		if (cached) {
			console.log("📦 Returning cached WakaTime data");
			return cached;
		}

		return null;
	}
}

/**
 * Get WakaTime data (from cache or fetch if needed)
 */
async function getWakaTimeData() {
	const cached = await getCache(CACHE_KEY);

	if (cached) {
		return cached;
	}

	return await fetchWakaTimeData();
}

module.exports = {
	fetchWakaTimeData,
	getWakaTimeData,
	CACHE_KEY,
};
