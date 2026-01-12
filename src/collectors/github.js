const axios = require("axios");
const { setCache, getCache } = require("../cache/redis");

const GITHUB_API = "https://api.github.com";
const GITHUB_GRAPHQL = "https://api.github.com/graphql";
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
 * GitHub GraphQL request helper
 */
async function graphqlRequest(query, variables) {
	const token = process.env.GITHUB_TOKEN;
	if (!token) return null;

	try {
		const response = await axios.post(
			GITHUB_GRAPHQL,
			{ query, variables },
			{
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				timeout: 20000,
			}
		);

		if (response.data.errors) {
			console.warn("⚠️  GitHub GraphQL errors:", response.data.errors);
			return null;
		}
		return response.data.data;
	} catch (error) {
		console.warn("⚠️  GitHub GraphQL request failed:", error.message);
		return null;
	}
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
	// Consider only owned, non-archived repositories to avoid skew from forks/archives
	const eligible = repos.filter((r) => !r.fork && !r.archived && r.language);

	const languageMap = new Map();

	for (const repo of eligible) {
		const lang = repo.language;
		const count = languageMap.get(lang) || 0;
		languageMap.set(lang, count + 1);
	}

	const total = eligible.length || 1;

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
 * Categorize commits by time of day (morning, daytime, evening, night)
 * Returns distribution based on commit timestamp hours
 */
function categorizeCommitsByTimeOfDay(commits) {
	const distribution = {
		morning: { count: 0, hours: "6:00 - 12:00", commits: [] },
		daytime: { count: 0, hours: "12:00 - 18:00", commits: [] },
		evening: { count: 0, hours: "18:00 - 24:00", commits: [] },
		night: { count: 0, hours: "0:00 - 6:00", commits: [] },
	};

	for (const commit of commits) {
		const timestamp =
			commit.commit?.author?.date || commit.commit?.committer?.date;
		if (!timestamp) continue;

		const date = new Date(timestamp);
		const hour = date.getHours();

		// Categorize based on hour (using local time)
		if (hour >= 6 && hour < 12) {
			distribution.morning.count++;
			distribution.morning.commits.push({
				sha: commit.sha?.substring(0, 7),
				message: commit.commit?.message?.split("\n")[0],
				date: timestamp,
			});
		} else if (hour >= 12 && hour < 18) {
			distribution.daytime.count++;
			distribution.daytime.commits.push({
				sha: commit.sha?.substring(0, 7),
				message: commit.commit?.message?.split("\n")[0],
				date: timestamp,
			});
		} else if (hour >= 18 && hour < 24) {
			distribution.evening.count++;
			distribution.evening.commits.push({
				sha: commit.sha?.substring(0, 7),
				message: commit.commit?.message?.split("\n")[0],
				date: timestamp,
			});
		} else {
			distribution.night.count++;
			distribution.night.commits.push({
				sha: commit.sha?.substring(0, 7),
				message: commit.commit?.message?.split("\n")[0],
				date: timestamp,
			});
		}
	}

	const totalCommits =
		distribution.morning.count +
		distribution.daytime.count +
		distribution.evening.count +
		distribution.night.count;

	// Calculate percentages
	for (const period of Object.keys(distribution)) {
		distribution[period].percent =
			totalCommits > 0
				? ((distribution[period].count / totalCommits) * 100).toFixed(1)
				: 0;
		// Limit stored commits to last 5 per period
		distribution[period].commits = distribution[period].commits.slice(-5);
	}

	return {
		total_commits: totalCommits,
		distribution,
		note: "Commits categorized by UTC timestamp hour",
	};
}

/**
 * Build day-wise commit counts for the last N days using REST API
 * Aggregates commits authored by the authenticated user across owned repos.
 */
async function buildCommitHeatmapREST(username, repos, days, headers) {
	const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
	const untilDate = new Date();
	const sinceISO = fromDate.toISOString();
	const untilISO = untilDate.toISOString();

	const dailyCounts = new Map();
	const allCommits = [];

	// Initialize map for all dates in range to ensure zeros are present
	for (let i = 0; i < days; i++) {
		const d = new Date(fromDate.getTime() + i * 24 * 60 * 60 * 1000)
			.toISOString()
			.split("T")[0];
		dailyCounts.set(d, 0);
	}

	// Consider non-fork repos where the user has ownership
	const targetRepos = repos.filter((r) => !r.fork);

	for (const repo of targetRepos) {
		const owner = repo.owner?.login || username;
		const commitsUrl = `${GITHUB_API}/repos/${owner}/${
			repo.name
		}/commits?author=${encodeURIComponent(username)}&since=${encodeURIComponent(
			sinceISO
		)}&until=${encodeURIComponent(untilISO)}`;

		// Paginate commits (default branch) and tally by day
		const commits = await fetchAllPages(commitsUrl, headers, 10);
		allCommits.push(...commits);
		for (const c of commits) {
			const dateStr = (
				c.commit?.author?.date ||
				c.commit?.committer?.date ||
				c.created_at ||
				""
			).split("T")[0];
			if (!dateStr) continue;
			if (dailyCounts.has(dateStr)) {
				dailyCounts.set(dateStr, (dailyCounts.get(dateStr) || 0) + 1);
			}
		}
	}

	const daily = [...dailyCounts.entries()]
		.map(([date, commits]) => ({ date, commits }))
		.sort((a, b) => a.date.localeCompare(b.date));

	const totalCommits = daily.reduce((sum, d) => sum + d.commits, 0);

	// Analyze time distribution
	const timeDistribution = categorizeCommitsByTimeOfDay(allCommits);

	return {
		range_days: days,
		total_commits: totalCommits,
		daily,
		time_distribution: timeDistribution,
		note: "Counts commits authored by the user on default branches across non-fork repos",
	};
}

/**
 * Build day-wise contributions (all types) via GraphQL calendar — fallback
 */
async function buildContributionCalendarGraphQL(username, days) {
	const to = new Date();
	const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

	const query = `
	  query($login: String!, $from: DateTime!, $to: DateTime!) {
		user(login: $login) {
		  contributionsCollection(from: $from, to: $to) {
			contributionCalendar {
			  weeks {
				contributionDays { date contributionCount }
			  }
			}
		  }
		}
	  }
	`;

	const data = await graphqlRequest(query, {
		login: username,
		from: from.toISOString(),
		to: to.toISOString(),
	});

	if (!data?.user?.contributionsCollection?.contributionCalendar?.weeks) {
		return null;
	}

	const daysArr = [];
	for (const wk of data.user.contributionsCollection.contributionCalendar
		.weeks) {
		for (const d of wk.contributionDays) {
			daysArr.push({ date: d.date, contributions: d.contributionCount });
		}
	}
	daysArr.sort((a, b) => a.date.localeCompare(b.date));

	const total = daysArr.reduce((s, d) => s + d.contributions, 0);

	return {
		range_days: days,
		total_contributions: total,
		daily: daysArr,
		note: "GraphQL calendar: includes commits, PRs, issues, etc.",
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
 * Calculate contribution streak from GraphQL contribution calendar days
 * Uses days with contributions > 0 across the provided period
 */
function calculateStreakFromContributionDays(daysArr) {
	if (!Array.isArray(daysArr) || daysArr.length === 0) {
		return {
			current_streak: 0,
			longest_streak_in_period: 0,
			active_days_in_period: 0,
			note: "Calculated from GraphQL contributions calendar",
		};
	}

	// Build a set of dates with at least one contribution
	const activeDates = new Set();
	for (const d of daysArr) {
		if (d && d.date && (d.contributions || d.contributionCount || 0) > 0) {
			activeDates.add(d.date);
		}
	}

	const sortedDates = [...activeDates].sort();
	const todayStr = new Date().toISOString().split("T")[0];
	const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000)
		.toISOString()
		.split("T")[0];

	// Current streak: consecutive active days ending today or yesterday
	let currentStreak = 0;
	let startCheck = null;
	if (activeDates.has(todayStr)) {
		startCheck = new Date(todayStr);
	} else if (activeDates.has(yesterdayStr)) {
		startCheck = new Date(yesterdayStr);
	}

	if (startCheck) {
		let cursor = new Date(startCheck);
		while (activeDates.has(cursor.toISOString().split("T")[0])) {
			currentStreak++;
			cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
		}
	}

	// Longest streak within the period
	let longestStreak = 0;
	let temp = 1;
	for (let i = 1; i < sortedDates.length; i++) {
		const prev = new Date(sortedDates[i - 1]);
		const curr = new Date(sortedDates[i]);
		const diffDays = (curr - prev) / (24 * 60 * 60 * 1000);
		if (diffDays === 1) {
			temp++;
		} else {
			if (temp > longestStreak) longestStreak = temp;
			temp = 1;
		}
	}
	if (temp > longestStreak) longestStreak = temp;

	return {
		current_streak: currentStreak,
		longest_streak_in_period: longestStreak,
		active_days_in_period: sortedDates.length,
		note: "Calculated from GraphQL contributions calendar",
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
		// Prefer accurate streak from contributions calendar when available
		let streak = calculateStreak(events);

		// Step 3a: Build day-wise commit heatmap (last 365 days)
		let commitHeatmap = null;
		try {
			commitHeatmap = await buildCommitHeatmapREST(
				username,
				repos,
				365,
				headers
			);
		} catch (e) {
			console.warn("⚠️  Failed to build commit heatmap via REST:", e.message);
		}

		// Optional: GraphQL contributions calendar fallback
		let contributionsCalendar = null;
		try {
			contributionsCalendar = await buildContributionCalendarGraphQL(
				username,
				365
			);
		} catch (e) {
			console.warn(
				"⚠️  Failed to fetch GraphQL contributions calendar:",
				e.message
			);
		}

		// If we have contributions calendar, recompute streak from it
		if (
			contributionsCalendar?.daily &&
			Array.isArray(contributionsCalendar.daily)
		) {
			streak = calculateStreakFromContributionDays(contributionsCalendar.daily);
		}

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

			commits_last_365_days: commitHeatmap,
			contributions_last_365_days: contributionsCalendar,

			contribution_signals: {
				...streak,
				// Aliases for clarity and UI correctness
				streak: streak.current_streak,
				streak_current: streak.current_streak,
				streak_longest: streak.longest_streak_in_period,
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
