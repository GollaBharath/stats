const express = require("express");
const { getDiscordData } = require("../collectors/discord");
const { getSpotifyData } = require("../collectors/spotify");
const { getLeetCodeData } = require("../collectors/leetcode");
const { getWakaTimeData } = require("../collectors/wakatime");
const { getGitHubData } = require("../collectors/github");

const router = express.Router();

/**
 * GET / - All stats aggregated
 */
router.get("/", async (req, res) => {
	try {
		const [discord, spotify, leetcode, wakatime, github] = await Promise.all([
			getDiscordData(),
			getSpotifyData(),
			getLeetCodeData(),
			getWakaTimeData(),
			getGitHubData(),
		]);

		res.json({
			meta: {
				generated_at: new Date().toISOString(),
				version: "1.0.0",
			},
			data: {
				discord,
				spotify,
				leetcode,
				wakatime,
				github,
			},
		});
	} catch (error) {
		console.error("Error fetching aggregated stats:", error);
		res.status(500).json({
			error: "Failed to fetch stats",
			message: error.message,
		});
	}
});

/**
 * GET /discord - Discord presence data
 */
router.get("/discord", async (req, res) => {
	try {
		const data = await getDiscordData();

		if (!data) {
			return res.status(404).json({
				error: "Discord data not available",
				message:
					"Check if DISCORD_USER_ID is configured and you have joined the Lanyard Discord server",
			});
		}

		res.json({
			meta: {
				generated_at: new Date().toISOString(),
			},
			data,
		});
	} catch (error) {
		console.error("Error fetching Discord data:", error);
		res.status(500).json({
			error: "Failed to fetch Discord data",
			message: error.message,
		});
	}
});

/**
 * GET /spotify - Spotify listening data (from Discord)
 */
router.get("/spotify", async (req, res) => {
	try {
		const data = await getSpotifyData();

		if (!data) {
			return res.status(404).json({
				error: "Spotify data not available",
				message:
					"Make sure you are listening to Spotify with Discord integration enabled",
			});
		}

		res.json({
			meta: {
				generated_at: new Date().toISOString(),
			},
			data,
		});
	} catch (error) {
		console.error("Error fetching Spotify data:", error);
		res.status(500).json({
			error: "Failed to fetch Spotify data",
			message: error.message,
		});
	}
});

/**
 * GET /leetcode - LeetCode statistics
 */
router.get("/leetcode", async (req, res) => {
	try {
		const data = await getLeetCodeData();

		if (!data) {
			return res.status(404).json({
				error: "LeetCode data not available",
				message: "Check if LEETCODE_USERNAME is configured correctly",
			});
		}

		res.json({
			meta: {
				generated_at: new Date().toISOString(),
			},
			data,
		});
	} catch (error) {
		console.error("Error fetching LeetCode data:", error);
		res.status(500).json({
			error: "Failed to fetch LeetCode data",
			message: error.message,
		});
	}
});

/**
 * GET /leetcode/submissions/daily - Day-wise submissions for last 365 days
 */
router.get("/leetcode/submissions/daily", async (req, res) => {
	try {
		const data = await getLeetCodeData();

		if (!data?.submissions_last_365_days) {
			return res.status(404).json({
				error: "LeetCode submissions heatmap not available",
				message:
					"Check LEETCODE_USERNAME. Data is pulled from LeetCode calendar and may be cached.",
			});
		}

		res.json({
			meta: { generated_at: new Date().toISOString() },
			data: data.submissions_last_365_days,
		});
	} catch (error) {
		console.error("Error fetching LeetCode daily submissions heatmap:", error);
		res.status(500).json({
			error: "Failed to fetch LeetCode daily submissions heatmap",
			message: error.message,
		});
	}
});

/**
 * GET /wakatime - WakaTime coding statistics
 */
router.get("/wakatime", async (req, res) => {
	try {
		const data = await getWakaTimeData();

		if (!data) {
			return res.status(404).json({
				error: "WakaTime data not available",
				message: "Check if WAKATIME_API_KEY is configured correctly",
			});
		}

		res.json({
			meta: {
				generated_at: new Date().toISOString(),
			},
			data,
		});
	} catch (error) {
		console.error("Error fetching WakaTime data:", error);
		res.status(500).json({
			error: "Failed to fetch WakaTime data",
			message: error.message,
		});
	}
});

/**
 * GET /github - GitHub profile and activity statistics
 */
router.get("/github", async (req, res) => {
	try {
		const data = await getGitHubData();

		if (!data) {
			return res.status(404).json({
				error: "GitHub data not available",
				message: "Check if GITHUB_TOKEN is configured correctly",
			});
		}

		res.json({
			meta: {
				generated_at: new Date().toISOString(),
			},
			data,
		});
	} catch (error) {
		console.error("Error fetching GitHub data:", error);
		res.status(500).json({
			error: "Failed to fetch GitHub data",
			message: error.message,
		});
	}
});

/**
 * GET /github/commits/daily - Day-wise commits for last 365 days
 */
router.get("/github/commits/daily", async (req, res) => {
	try {
		const data = await getGitHubData();

		if (!data?.commits_last_365_days) {
			return res.status(404).json({
				error: "Commit heatmap not available",
				message:
					"Ensure GITHUB_TOKEN is configured and try again. Data may be cached.",
			});
		}

		res.json({
			meta: { generated_at: new Date().toISOString() },
			data: data.commits_last_365_days,
		});
	} catch (error) {
		console.error("Error fetching daily commit heatmap:", error);
		res.status(500).json({
			error: "Failed to fetch daily commit heatmap",
			message: error.message,
		});
	}
});

/**
 * GET /github/contributions/daily - Day-wise contributions (fallback)
 */
router.get("/github/contributions/daily", async (req, res) => {
	try {
		const data = await getGitHubData();

		if (!data?.contributions_last_365_days) {
			return res.status(404).json({
				error: "Contribution calendar not available",
				message:
					"Ensure GITHUB_TOKEN is configured and try again. Data may be cached.",
			});
		}

		res.json({
			meta: { generated_at: new Date().toISOString() },
			data: data.contributions_last_365_days,
		});
	} catch (error) {
		console.error("Error fetching daily contributions calendar:", error);
		res.status(500).json({
			error: "Failed to fetch daily contributions calendar",
			message: error.message,
		});
	}
});

/**
 * GET /health - Health check endpoint
 */
router.get("/health", (req, res) => {
	res.json({
		status: "ok",
		timestamp: new Date().toISOString(),
	});
});

module.exports = router;
