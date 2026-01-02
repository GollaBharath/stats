const axios = require("axios");
const { setCache, getCache } = require("../cache/redis");

const GITHUB_API = "https://api.github.com";
const CACHE_KEY = "stats:github";
const CACHE_TTL = parseInt(process.env.CACHE_TTL, 10) || 300;

/**
 * GitHub API client with rate limit handling
 */
function getHeaders() {
	const token = process.env.GITHUB_TOKEN;
	return {
		Accept: "application/vnd.github.v3+json",
		"User-Agent": "Personal-Stats-API/1.0",
		...(token && { Authorization: `Bearer ${token}` }),
	};
}

/**
 * Safe API request with error handling
 * Returns null on failure instead of throwing
 */
async function safeRequest(url, headers) {
	try {
		const response = await axios.get(url, { headers, timeout: 15000 });
		return response.data;
	} catch (error) {
		if (error.response?.status === 403) {
			console.warn(`⚠️  GitHub API rate limit or forbidden: ${url}`);
		} else if (error.response?.status === 404) {
			console.warn(`⚠️  GitHub resource not found: ${url}`);
		} else {
			console.warn(`⚠️  GitHub API error for ${url}:`, error.message);
		}
		return null;
	}
}

/**
 * Fetch all pages of a paginated GitHub API endpoint
 * Limited to avoid rate limits (max 10 pages by default)
 */
async function fetchAllPages(url, headers, maxPages = 10) {
	const results = [];
	let page = 1;
	let hasMore = true;

	while (hasMore && page <= maxPages) {
		const separator = url.includes("?") ? "&" : "?";
		const pageUrl = `${url}${separator}per_page=100&page=${page}`;
		const data = await safeRequest(pageUrl, headers);

		if (!data || !Array.isArray(data) || data.length === 0) {
			hasMore = false;
		} else {
			results.push(...data);
			hasMore = data.length === 100;
			page++;
		}
	}

	return results;
}

/**
 * Aggregate language statistics across all repositories
 */
function aggregateLanguages(repos) {
	const languageMap = new Map();

	for (const repo of repos) {
		if (repo.language) {
			const count = languageMap.get(repo.language) || 0;
			languageMap.set(repo.language, count + 1);
		}
	}

	const total = repos.filter((r) => r.language).length || 1;

	return [...languageMap.entries()]
		.map(([name, count]) => ({
			name,
			count,
			percent: ((count / total) * 100).toFixed(1),
		}))
		.sort((a, b) => b.count - a.count);
}

/**
 * Get top repositories by stars
 */
function getTopRepos(repos, limit = 10) {
	return repos
		.filter((repo) => !repo.fork)
		.sort((a, b) => b.stargazers_count - a.stargazers_count)
		.slice(0, limit)
		.map((repo) => ({
			name: repo.name,
			full_name: repo.full_name,
			description: repo.description,
			url: repo.html_url,
			stars: repo.stargazers_count,
			forks: repo.forks_count,
			language: repo.language,
			created_at: repo.created_at,
			updated_at: repo.updated_at,
			pushed_at: repo.pushed_at,
			is_fork: repo.fork,
			is_archived: repo.archived,
			topics: repo.topics || [],
		}));
}

/**
 * Calculate aggregate repository metrics
 */
function calculateRepoMetrics(repos) {
	const ownedRepos = repos.filter((r) => !r.fork);
	const forkedRepos = repos.filter((r) => r.fork);

	const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
	const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);
	const ownedStars = ownedRepos.reduce((sum, r) => sum + r.stargazers_count, 0);

	return {
		total_repos: repos.length,
		owned_repos: ownedRepos.length,
		forked_repos: forkedRepos.length,
		total_stars: totalStars,
		owned_stars: ownedStars,
		total_forks: totalForks,
		archived_count: repos.filter((r) => r.archived).length,
	};
}

/**
 * Parse GitHub events into activity metrics
 * Events API returns last 90 days, max 300 events
 */
function parseActivityFromEvents(events, dayLimit = 30) {
	const now = new Date();
	const cutoff = new Date(now.getTime() - dayLimit * 24 * 60 * 60 * 1000);

	// Filter to recent events only
	const recentEvents = events.filter((e) => new Date(e.created_at) >= cutoff);

	// Activity counters
	let commits = 0;
	let pullRequestsOpened = 0;
	let pullRequestsMerged = 0;
	let issuesOpened = 0;
	let pushEvents = 0;

	// Daily activity map
	const dailyActivity = new Map();

	// Repo activity tracking
	const repoActivity = new Map();

	for (const event of recentEvents) {
		const date = event.created_at.split("T")[0];
		const count = dailyActivity.get(date) || 0;
		dailyActivity.set(date, count + 1);

		// Track repo activity
		if (event.repo) {
			const repoName = event.repo.name;
			const repoCount = repoActivity.get(repoName) || 0;
			repoActivity.set(repoName, repoCount + 1);
		}

		switch (event.type) {
			case "PushEvent":
				pushEvents++;
				// Each push can have multiple commits
				commits += event.payload?.commits?.length || 0;
				break;
			case "PullRequestEvent":
				if (event.payload?.action === "opened") {
					pullRequestsOpened++;
				} else if (
					event.payload?.action === "closed" &&
					event.payload?.pull_request?.merged
				) {
					pullRequestsMerged++;
				}
				break;
			case "IssuesEvent":
				if (event.payload?.action === "opened") {
					issuesOpened++;
				}
				break;
		}
	}

	// Build timeline (sorted by date)
	const timeline = [...dailyActivity.entries()]
		.map(([date, count]) => ({ date, events: count }))
		.sort((a, b) => a.date.localeCompare(b.date));

	// Get most active repos
	const mostActiveRepos = [...repoActivity.entries()]
		.map(([repo, count]) => ({ repo, events: count }))
		.sort((a, b) => b.events - a.events)
		.slice(0, 5);

	return {
		period_days: dayLimit,
		commits_count: commits,
		commits_note:
			"Estimated from push events (may undercount commits pushed before token creation)",
		push_events: pushEvents,
		pull_requests_opened: pullRequestsOpened,
		pull_requests_merged: pullRequestsMerged,
		issues_opened: issuesOpened,
		total_events: recentEvents.length,
		daily_timeline: timeline,
		most_active_repos: mostActiveRepos,
	};
}

/**
 * Calculate contribution streak (best effort from events)
 * This is an approximation based on available event data
 */
function calculateStreak(events) {
	if (!events.length) {
		return {
			current_streak: 0,
			longest_streak: 0,
			note: "Calculated from recent events (up to 90 days)",
		};
	}

	// Get unique dates with activity
	const activeDates = new Set();
	for (const event of events) {
		const date = event.created_at.split("T")[0];
		activeDates.add(date);
	}

	const sortedDates = [...activeDates].sort();

	if (sortedDates.length === 0) {
		return {
			current_streak: 0,
			longest_streak: 0,
			note: "Calculated from recent events (up to 90 days)",
		};
	}

	// Calculate current streak (from today backwards)
	const today = new Date().toISOString().split("T")[0];
	const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
		.toISOString()
		.split("T")[0];

	let currentStreak = 0;
	let checkDate = activeDates.has(today) ? today : yesterday;

	if (activeDates.has(today) || activeDates.has(yesterday)) {
		let date = new Date(checkDate);
		while (activeDates.has(date.toISOString().split("T")[0])) {
			currentStreak++;
			date = new Date(date.getTime() - 24 * 60 * 60 * 1000);
		}
	}

	// Calculate longest streak
	let longestStreak = 0;
	let tempStreak = 1;

	for (let i = 1; i < sortedDates.length; i++) {
		const prevDate = new Date(sortedDates[i - 1]);
		const currDate = new Date(sortedDates[i]);
		const diffDays = (currDate - prevDate) / (24 * 60 * 60 * 1000);

		if (diffDays === 1) {
			tempStreak++;
		} else {
			longestStreak = Math.max(longestStreak, tempStreak);
			tempStreak = 1;
		}
	}
	longestStreak = Math.max(longestStreak, tempStreak);

	return {
		current_streak: currentStreak,
		longest_streak_in_period: longestStreak,
		active_days_in_period: sortedDates.length,
		note: "Calculated from recent events (up to 90 days, max 300 events)",
	};
}

/**
 * Fetch GitHub data from REST API
 * Uses authenticated requests when GITHUB_TOKEN is available
 */
async function fetchGitHubData() {
	const token = process.env.GITHUB_TOKEN;

	if (!token) {
		console.warn("⚠️  GITHUB_TOKEN not configured");
		return null;
	}

	const headers = getHeaders();

	try {
		console.log("🔄 Fetching GitHub data...");

		// Step 1: Fetch authenticated user profile
		const user = await safeRequest(`${GITHUB_API}/user`, headers);

		if (!user) {
			throw new Error("Failed to fetch GitHub user profile");
		}

		const username = user.login;

		// Step 2: Fetch repositories and events in parallel
		const [repos, events] = await Promise.all([
			fetchAllPages(
				`${GITHUB_API}/user/repos?type=all&sort=updated`,
				headers,
				10
			),
			fetchAllPages(`${GITHUB_API}/users/${username}/events`, headers, 3),
		]);

		// Step 3: Process data
		const repoMetrics = calculateRepoMetrics(repos);
		const topRepos = getTopRepos(repos, 10);
		const languageStats = aggregateLanguages(repos);
		const activity = parseActivityFromEvents(events, 30);
		const streak = calculateStreak(events);

		// Find last activity timestamp
		const lastActivity = events.length > 0 ? events[0].created_at : null;

		// Build normalized response
		const normalized = {
			user: {
				username: user.login,
				name: user.name,
				avatar_url: user.avatar_url,
				bio: user.bio,
				location: user.location,
				website: user.blog || null,
				company: user.company,
				twitter_username: user.twitter_username,
				public_repos: user.public_repos,
				public_gists: user.public_gists,
				followers: user.followers,
				following: user.following,
				created_at: user.created_at,
				profile_url: user.html_url,
			},

			repository_metrics: {
				...repoMetrics,
				note: "Metrics include both public and private repos visible to the token",
			},

			top_repositories: topRepos,

			language_distribution: languageStats,

			activity_last_30_days: activity,

			contribution_signals: {
				...streak,
				last_activity: lastActivity,
				last_activity_human: lastActivity
					? `${Math.floor(
							(Date.now() - new Date(lastActivity)) / (1000 * 60 * 60)
					  )} hours ago`
					: null,
			},

			rate_limit_note:
				"GitHub API has rate limits. Authenticated: 5000 req/hr. Data may be cached.",

			last_updated: new Date().toISOString(),
		};

		await setCache(CACHE_KEY, normalized, CACHE_TTL);
		console.log("✅ GitHub data updated");

		return normalized;
	} catch (error) {
		console.error(
			"❌ GitHub fetch failed:",
			error.response?.status,
			error.response?.data?.message || error.message
		);

		// Attempt to return cached data on failure
		const cached = await getCache(CACHE_KEY);
		if (cached) {
			console.log("↩️  Returning cached GitHub data");
			return cached;
		}

		return null;
	}
}

/**
 * Cache-first access pattern
 * Returns cached data if available, otherwise fetches fresh
 */
async function getGitHubData() {
	const cached = await getCache(CACHE_KEY);
	if (cached) return cached;
	return fetchGitHubData();
}

module.exports = {
	fetchGitHubData,
	getGitHubData,
	CACHE_KEY,
};
