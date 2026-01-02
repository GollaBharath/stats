require("dotenv").config();
const { initRedis } = require("./cache/redis");
const { initScheduler } = require("./scheduler");

console.log("🔧 Starting Personal Stats Background Worker...\n");

async function startWorker() {
	try {
		// Initialize Redis connection
		console.log("📦 Connecting to Redis...");
		initRedis();

		// Wait a moment for Redis to connect
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Initialize data collection scheduler
		initScheduler();

		console.log("\n✅ Background worker started successfully");
		console.log("📊 Data collection running in background");

		// Keep the process alive
		process.on("SIGINT", () => {
			console.log("\nSIGINT received, shutting down gracefully...");
			process.exit(0);
		});

		process.on("SIGTERM", () => {
			console.log("\nSIGTERM received, shutting down gracefully...");
			process.exit(0);
		});
	} catch (error) {
		console.error("❌ Failed to start worker:", error.message);
		process.exit(1);
	}
}

startWorker();
