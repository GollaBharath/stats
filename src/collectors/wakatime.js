const axios = require("axios");
const { setCache, getCache } = require("../cache/redis");

const WAKATIME_API = "https://wakatime.com/api/v1";
const CACHE_KEY = "stats:wakatime";
const CACHE_TTL = parseInt(process.env.CACHE_TTL, 10) || 300;

/**
 * Aggregation helpers
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

	const total = [...map.values()].reduce((s, i) => s + i.total_seconds, 0);

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
 * Normalize stats window
 */
function normalizeStats(stats) {
	const days = stats.days || [];

	// Some WakaTime responses only include aggregated totals (no per-day breakdown)
	const hasPerDayBreakdown = days.length > 0;

	if (!hasPerDayBreakdown) {
		const totalSeconds = stats.grand_total?.total_seconds || 0;
		const dailyAverage = stats.daily_average || 0;

		const normalizeList = (items = [], limit) => {
			const normalized = items.map((i) => ({
				name: i.name,
				total_seconds: i.total_seconds || 0,
				percent: i.percent || 0,
				digital: i.digital || secondsToDigital(i.total_seconds || 0),
				text: i.text || secondsToText(i.total_seconds || 0),
			}));

			return typeof limit === "number"
				? normalized.slice(0, limit)
				: normalized;
		};

		const bestDay = stats.best_day
			? {
					date: stats.best_day.date || stats.best_day.range?.date || null,
					total_seconds:
						stats.best_day.grand_total?.total_seconds ||
						stats.best_day.total_seconds ||
						0,
					text:
						stats.best_day.grand_total?.text ||
						stats.best_day.text ||
						secondsToText(
							stats.best_day.grand_total?.total_seconds ||
								stats.best_day.total_seconds ||
								0
						),
			  }
			: null;

		return {
			total_seconds: totalSeconds,
			human_readable_total:
				stats.human_readable_total || secondsToText(totalSeconds),
			daily_average: dailyAverage,
			human_readable_daily_average:
				stats.human_readable_daily_average || secondsToText(dailyAverage),
			best_day: bestDay,
			languages: normalizeList(stats.languages, 10),
			projects: normalizeList(stats.projects, 10),
			editors: normalizeList(stats.editors),
			categories: normalizeList(stats.categories),
			operating_systems: normalizeList(stats.operating_systems),
			days: [],
		};
	}

	let totalSeconds = 0;
	let bestDay = null;

	const languages = [];
	const projects = [];
	const editors = [];
	const categories = [];
	const operatingSystems = [];

	for (const day of days) {
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

	const daysWithData = days.length || 1;
	const dailyAverage = Math.floor(totalSeconds / daysWithData);

	return {
		total_seconds: totalSeconds,
		human_readable_total: secondsToText(totalSeconds),
		daily_average: dailyAverage,
		human_readable_daily_average: secondsToText(dailyAverage),
		best_day: bestDay,
		languages: aggregate(languages).slice(0, 10),
		projects: aggregate(projects).slice(0, 10),
		editors: aggregate(editors),
		categories: aggregate(categories),
		operating_systems: aggregate(operatingSystems),
		days: days.map((d) => ({
			date: d.range.date,
			total_seconds: d.grand_total.total_seconds,
			text: d.grand_total.text,
			digital: d.grand_total.digital,
		})),
	};
}

/**
 * Fetch WakaTime data (FREE-TIER ONLY)
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

		const [userRes, stats7Res, stats30Res, allTimeRes] = await Promise.all([
			axios.get(`${WAKATIME_API}/users/current`, { headers }),
			axios.get(`${WAKATIME_API}/users/current/stats/last_7_days`, { headers }),
			axios.get(`${WAKATIME_API}/users/current/stats/last_30_days`, {
				headers,
			}),
			axios
				.get(`${WAKATIME_API}/users/current/all_time_since_today`, {
					headers,
				})
				.catch(() => null),
		]);

		const user = userRes.data.data;
		const stats7 = normalizeStats(stats7Res.data.data);
		const stats30 = normalizeStats(stats30Res.data.data);

		/**
		 * Explicit estimate — NOT real all-time
		 */
		const estimatedAllTimeSeconds = stats30.daily_average * 365;

		// Process all-time stats if available
		let allTimeStats = null;
		if (allTimeRes?.data?.data) {
			const allTime = allTimeRes.data.data;
			allTimeStats = {
				total_seconds: allTime.total_seconds || 0,
				text: allTime.text || secondsToText(allTime.total_seconds || 0),
				daily_average: allTime.daily_average || 0,
				daily_average_text: secondsToText(allTime.daily_average || 0),
				source: "wakatime_all_time_api",
			};
		}

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

			stats_last_7_days: stats7,
			stats_last_30_days: stats30,

			all_time_stats: allTimeStats || {
				total_seconds: estimatedAllTimeSeconds,
				text: secondsToText(estimatedAllTimeSeconds),
				source: "estimated_from_last_30_days",
			},

			// Keep for backward compatibility
			derived_all_time_estimate: {
				total_seconds: allTimeStats?.total_seconds || estimatedAllTimeSeconds,
				text: allTimeStats?.text || secondsToText(estimatedAllTimeSeconds),
				source: allTimeStats
					? "wakatime_all_time_api"
					: "estimated_from_last_30_days",
			},

			last_updated: new Date().toISOString(),
		};

		await setCache(CACHE_KEY, normalized, CACHE_TTL);
		console.log("✅ WakaTime data updated");

		return normalized;
	} catch (error) {
		console.error(
			"❌ WakaTime fetch failed:",
			error.response?.status,
			error.response?.data || error.message
		);

		const cached = await getCache(CACHE_KEY);
		if (cached) return cached;

		return null;
	}
}

/**
 * Cache-first access
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
