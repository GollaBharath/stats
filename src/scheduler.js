const cron = require("node-cron");
const { fetchDiscordData } = require("./collectors/discord");
const { fetchLeetCodeData } = require("./collectors/leetcode");
const { fetchWakaTimeData } = require("./collectors/wakatime");

/**
 * Initialize all scheduled data collection jobs
 * Each collector runs at a configurable interval
 */
function initScheduler() {
	console.log("⏰ Initializing data collection scheduler...");

	// Get intervals from environment (in minutes)
	const discordInterval = parseInt(process.env.INTERVAL_DISCORD) || 2;
	const leetcodeInterval = parseInt(process.env.INTERVAL_LEETCODE) || 60;
	const wakatimeInterval = parseInt(process.env.INTERVAL_WAKATIME) || 30;

	console.log("📅 Collection intervals:");
	console.log(`   - Discord/Spotify: every ${discordInterval} minute(s)`);
	console.log(`   - LeetCode: every ${leetcodeInterval} minute(s)`);
	console.log(`   - WakaTime: every ${wakatimeInterval} minute(s)`);

	// Discord/Spotify collector
	// Runs frequently since presence updates in real-time
	const discordCron = `*/${discordInterval} * * * *`;
	cron.schedule(discordCron, async () => {
		console.log(
			`\n[${new Date().toISOString()}] Running Discord/Spotify collector...`
		);
		await fetchDiscordData();
	});

	// LeetCode collector
	// Runs less frequently since stats don't change often
	const leetcodeCron = `*/${leetcodeInterval} * * * *`;
	cron.schedule(leetcodeCron, async () => {
		console.log(
			`\n[${new Date().toISOString()}] Running LeetCode collector...`
		);
		await fetchLeetCodeData();
	});

	// WakaTime collector
	// Runs moderately since coding stats update periodically
	const wakatimeCron = `*/${wakatimeInterval} * * * *`;
	cron.schedule(wakatimeCron, async () => {
		console.log(
			`\n[${new Date().toISOString()}] Running WakaTime collector...`
		);
		await fetchWakaTimeData();
	});

	console.log("✅ Scheduler initialized successfully\n");

	// Run all collectors immediately on startup
	console.log("🚀 Running initial data collection...\n");
	Promise.all([fetchDiscordData(), fetchLeetCodeData(), fetchWakaTimeData()])
		.then(() => {
			console.log("\n✅ Initial data collection completed");
		})
		.catch((error) => {
			console.error(
				"\n❌ Error during initial data collection:",
				error.message
			);
		});
}

module.exports = {
	initScheduler,
};
