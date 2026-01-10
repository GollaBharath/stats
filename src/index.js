require("dotenv").config();
const express = require("express");
const { initRedis, isConnected } = require("./cache/redis");
const { initScheduler } = require("./scheduler");
const statsRoute = require("./routes/stats");

const app = express();

// Parse JSON request bodies
app.use(express.json());

// CORS configuration - allow requests from static sites
app.use((req, res, next) => {
	const allowedOrigins = process.env.ALLOWED_ORIGINS || "*";

	if (allowedOrigins === "*") {
		res.header("Access-Control-Allow-Origin", "*");
	} else {
		const origins = allowedOrigins.split(",").map((o) => o.trim());
		const origin = req.headers.origin;

		if (origins.includes(origin)) {
			res.header("Access-Control-Allow-Origin", origin);
		}
	}

	res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
	res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
	res.header("Access-Control-Max-Age", "86400"); // 24 hours

	// Handle preflight requests
	if (req.method === "OPTIONS") {
		return res.sendStatus(204);
	}

	next();
});

// Root route - API information
app.get("/", (req, res) => {
	res.json({
		name: "Personal Stats API",
		version: "1.0.0",
		description:
			"Telemetry and stats aggregation API for Discord, Spotify, LeetCode, and WakaTime",
		endpoints: {
			all_stats: "/stats",
			discord: "/stats/discord",
			spotify: "/stats/spotify",
			leetcode: "/stats/leetcode",
			leetcode_submissions_daily: "/stats/leetcode/submissions/daily",
			wakatime: "/stats/wakatime",
			github: "/stats/github",
			github_commits_daily: "/stats/github/commits/daily",
			github_contributions_daily: "/stats/github/contributions/daily",
			health: "/stats/health",
			time: "/time",
		},
		documentation: "https://github.com/GollaBharath/stats",
		status: "operational",
	});
});

// Mount stats routes
app.use("/stats", statsRoute);

// Time endpoint - returns current time in IST
app.get("/time", (req, res) => {
	const now = new Date();
	const istTime = new Intl.DateTimeFormat("en-US", {
		timeZone: "Asia/Kolkata",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	}).format(now);

	res.json({
		time: istTime,
	});
});

// Health check endpoint
app.get("/health", (req, res) => {
	res.json({
		status: "ok",
		redis_connected: isConnected(),
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({
		error: "Not Found",
		message: `Route ${req.path} not found`,
		available_routes: [
			"/",
			"/health",
			"/time",
			"/stats",
			"/stats/discord",
			"/stats/spotify",
			"/stats/leetcode",
			"/stats/leetcode/submissions/daily",
			"/stats/wakatime",
			"/stats/github",
			"/stats/github/commits/daily",
			"/stats/github/contributions/daily",
			"/stats/health",
		],
	});
});

// Error handler
app.use((err, req, res, next) => {
	console.error("Unhandled error:", err);
	res.status(500).json({
		error: "Internal Server Error",
		message:
			process.env.NODE_ENV === "development"
				? err.message
				: "Something went wrong",
	});
});

// Server initialization
const PORT = process.env.PORT || 3000;

async function startServer() {
	try {
		console.log("🚀 Starting Personal Stats API...\n");

		// Initialize Redis connection
		console.log("📦 Connecting to Redis...");
		initRedis();

		// Wait a moment for Redis to connect
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Initialize data collection scheduler
		initScheduler();

		// Start Express server
		app.listen(PORT, () => {
			console.log("\n" + "=".repeat(50));
			console.log(`✅ Server is running on port ${PORT}`);
			console.log(`📍 Local: http://localhost:${PORT}`);
			console.log(`📊 Stats API: http://localhost:${PORT}/stats`);
			console.log(`💚 Health Check: http://localhost:${PORT}/health`);
			console.log("=".repeat(50) + "\n");
		});
	} catch (error) {
		console.error("❌ Failed to start server:", error);
		process.exit(1);
	}
}

// Graceful shutdown
process.on("SIGTERM", () => {
	console.log("SIGTERM received, shutting down gracefully...");
	process.exit(0);
});

process.on("SIGINT", () => {
	console.log("\nSIGINT received, shutting down gracefully...");
	process.exit(0);
});

// Start the server
startServer();
