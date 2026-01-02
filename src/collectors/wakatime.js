const axios = require("axios");
const { setCache, getCache } = require("../cache/redis");

const WAKATIME_API = "https://wakatime.com/api/v1";
const CACHE_KEY = "stats:wakatime";
const CACHE_TTL = parseInt(process.env.CACHE_TTL, 10) || 300;

/**
 * Utility: aggregate breakdown arrays (languages, projects, etc.)
 */
function aggregate(items = []) {
	const map = new Map();

	for (const item of items) {
		const existing = map.get(item.name) || {
			name: item.name,
			total_seconds: 0,
		};
		existing.total_seconds += item.total_seconds;
		map.set(item.name, existing);
	}

	const total = [...map.values()].reduce((sum, i) => sum + i.total_seconds, 0);

	return [...map.values()]
		.map((i) => ({
			...i,
			percent: total ? (i.total_seconds / total) * 100 : 0,
			digital: secondsToDigital(i.total_seconds),
			text: secondsToText(i.total_seconds),
		}))
		.sort((a, b) => b.total_seconds - a.total_seconds);
}

/**
 * Time helpers
 */
function secondsToDigital(seconds) {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	return `${h}:${String(m).padStart(2, "0")}`;
}

function secondsToText(seconds) {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	return `${h} hrs ${m} mins`;
}

/**
 * Fetch WakaTime coding statistics (FREE-TIER SAFE)
 */
async function fetchWakaTimeData() {
	const apiKey = process.env.WAKATIME_API_KEY;

	if (!apiKey) {
		console.warn("⚠️  WAKATIME_API_KEY not configured");
		return null;
	}

	const authToken = Buffer.from(`${apiKey}:`).toString("base64");
	const headers = {
		Authorization: `Basic ${authToken}`,
		"User-Agent": "Personal-Stats-API/1.0",
	};

	try {
		console.log("🔄 Fetching WakaTime data...");

		const end = new Date();
		const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

		const [userRes, summariesRes, allTimeRes] = await Promise.all([
			axios.get(`${WAKATIME_API}/users/current`, { headers }),
			axios.get(`${WAKATIME_API}/users/current/stats/last_7_days`, {
				headers,
				params: {
					start: start.toISOString().split("T")[0],
					end: end.toISOString().split("T")[0],
				},
			}),
			axios.get(`${WAKATIME_API}/users/current/all_time_since_today`, {
				headers,
			}),
		]);

		const user = userRes.data.data;
		const summaries = summariesRes.data.data;
		const allTime = allTimeRes.data.data;

		// Aggregate from summaries
		let totalSeconds = 0;
		let bestDay = null;

		const languages = [];
		const projects = [];
		const editors = [];
		const categories = [];
		const operatingSystems = [];

		for (const day of summaries) {
			const dayTotal = day.grand_total.total_seconds;
			totalSeconds += dayTotal;

			if (!bestDay || dayTotal > bestDay.total_seconds) {
				bestDay = {
					date: day.range.date,
					total_seconds: dayTotal,
					text: day.grand_total.text,
				};
			}

			languages.push(...(day.languages || []));
			projects.push(...(day.projects || []));
			editors.push(...(day.editors || []));
			categories.push(...(day.categories || []));
			operatingSystems.push(...(day.operating_systems || []));
		}

		const daysWithData = summaries.length || 1;
		const dailyAverage = Math.floor(totalSeconds / daysWithData);

		const normalized = {
			user: {
				id: user.id,
				username: user.username,
				display_name: user.display_name,
				photo: user.photo,
				website: user.website,
				location: user.location,
				last_project: user.last_project,
				last_plugin_name: user.last_plugin_name,
				last_heartbeat_at: user.last_heartbeat_at,
			},

			stats_last_7_days: {
				total_seconds: totalSeconds,
				human_readable_total: secondsToText(totalSeconds),
				daily_average: dailyAverage,
				human_readable_daily_average: secondsToText(dailyAverage),
				languages: aggregate(languages).slice(0, 10),
				projects: aggregate(projects).slice(0, 10),
				editors: aggregate(editors),
				categories: aggregate(categories),
				operating_systems: aggregate(operatingSystems),
				best_day: bestDay,
			},

			all_time: {
				total_seconds: allTime.total_seconds,
				text: allTime.text,
				is_up_to_date: allTime.is_up_to_date,
			},

			daily_summaries: summaries.map((day) => ({
				date: day.range.date,
				total_seconds: day.grand_total.total_seconds,
				text: day.grand_total.text,
				digital: day.grand_total.digital,
			})),

			last_updated: new Date().toISOString(),
		};

		await setCache(CACHE_KEY, normalized, CACHE_TTL);
		console.log("✅ WakaTime data updated");

		return normalized;
	} catch (error) {
		if (error.response?.status === 402) {
			console.warn("⚠️  WakaTime premium endpoint blocked — using cache");
		} else {
			console.error("❌ WakaTime fetch failed:", error.message);
		}

		const cached = await getCache(CACHE_KEY);
		if (cached) return cached;

		return null;
	}
}

/**
 * Get WakaTime data (cache-first)
 */
async function getWakaTimeData() {
	const cached = await getCache(CACHE_KEY);
	if (cached) return cached;
	return fetchWakaTimeData();
}

module.exports = {
	fetchWakaTimeData,
	getWakaTimeData,
	CACHE_KEY,
};
