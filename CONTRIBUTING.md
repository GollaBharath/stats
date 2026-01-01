# Contributing Guide

This guide helps you extend the Personal Stats API with new data sources.

## Adding a New Data Source

Follow these steps to add a new collector:

### 1. Create the Collector

Create a new file in `src/collectors/` (e.g., `github.js`):

```javascript
const axios = require("axios");
const { setCache, getCache } = require("../cache/redis");

const API_ENDPOINT = "https://api.example.com";
const CACHE_KEY = "stats:yourservice";
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 300;

/**
 * Fetch data from your service
 */
async function fetchYourServiceData() {
	try {
		const apiKey = process.env.YOUR_SERVICE_API_KEY;

		if (!apiKey) {
			console.warn("⚠️  YOUR_SERVICE_API_KEY not configured");
			return null;
		}

		console.log("🔄 Fetching YourService data...");

		const response = await axios.get(`${API_ENDPOINT}/data`, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"User-Agent": "Personal-Stats-API/1.0",
			},
			timeout: 10000,
		});

		// Normalize the data structure
		const normalized = {
			// Your data structure here
			last_updated: new Date().toISOString(),
		};

		// Cache the data
		await setCache(CACHE_KEY, normalized, CACHE_TTL);

		console.log("✅ YourService data updated");
		return normalized;
	} catch (error) {
		console.error("❌ Error fetching YourService data:", error.message);

		// Return cached data if available
		const cached = await getCache(CACHE_KEY);
		if (cached) {
			console.log("📦 Returning cached YourService data");
			return cached;
		}

		return null;
	}
}

/**
 * Get data (from cache or fetch if needed)
 */
async function getYourServiceData() {
	const cached = await getCache(CACHE_KEY);

	if (cached) {
		return cached;
	}

	return await fetchYourServiceData();
}

module.exports = {
	fetchYourServiceData,
	getYourServiceData,
	CACHE_KEY,
};
```

### 2. Add to Scheduler

Update `src/scheduler.js`:

```javascript
const { fetchYourServiceData } = require("./collectors/yourservice");

function initScheduler() {
	// ... existing code ...

	// Get interval from environment
	const yourserviceInterval = parseInt(process.env.INTERVAL_YOURSERVICE) || 30;

	console.log(`   - YourService: every ${yourserviceInterval} minute(s)`);

	// Schedule the collector
	const yourserviceCron = `*/${yourserviceInterval} * * * *`;
	cron.schedule(yourserviceCron, async () => {
		console.log(
			`\n[${new Date().toISOString()}] Running YourService collector...`
		);
		await fetchYourServiceData();
	});

	// Add to initial collection
	Promise.all([
		// ... existing collectors ...
		fetchYourServiceData(),
	]).then(() => {
		// ...
	});
}
```

### 3. Add API Route

Update `src/routes/stats.js`:

```javascript
const { getYourServiceData } = require("../collectors/yourservice");

// Add to aggregated endpoint
router.get("/", async (req, res) => {
	try {
		const [discord, spotify, leetcode, wakatime, yourservice] =
			await Promise.all([
				getDiscordData(),
				getSpotifyData(),
				getLeetCodeData(),
				getWakaTimeData(),
				getYourServiceData(), // Add here
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
				yourservice, // Add here
			},
		});
	} catch (error) {
		// ...
	}
});

// Add dedicated endpoint
router.get("/yourservice", async (req, res) => {
	try {
		const data = await getYourServiceData();

		if (!data) {
			return res.status(404).json({
				error: "YourService data not available",
				message: "Check if YOUR_SERVICE_API_KEY is configured",
			});
		}

		res.json({
			meta: {
				generated_at: new Date().toISOString(),
			},
			data,
		});
	} catch (error) {
		console.error("Error fetching YourService data:", error);
		res.status(500).json({
			error: "Failed to fetch YourService data",
			message: error.message,
		});
	}
});
```

### 4. Update Environment Variables

Add to `.env.example`:

```bash
# ================================
# YOURSERVICE
# ================================

# Get your API key from: https://yourservice.com/api-keys
# YOUR_SERVICE_API_KEY=your_api_key_here

# Collection interval (in minutes)
INTERVAL_YOURSERVICE=30
```

### 5. Update Documentation

Add to `README.md`:

```markdown
### 5. YourService

- Your service description
- What data it collects
- Update interval
```

Add to `API_DOCS.md`:

```markdown
### X. YourService Statistics

**GET /stats/yourservice**

Returns data from YourService.

**Response:**

\`\`\`json
{
"meta": {
"generated_at": "2026-01-01T12:00:00.000Z"
},
"data": {
// Your response structure
}
}
\`\`\`
```

## Best Practices

### Error Handling

Always implement fallback to cached data:

```javascript
try {
	const response = await axios.get(url);
	await setCache(CACHE_KEY, data, CACHE_TTL);
	return data;
} catch (error) {
	console.error("Error:", error.message);
	const cached = await getCache(CACHE_KEY);
	if (cached) {
		return cached;
	}
	return null;
}
```

### Timeouts

Always set request timeouts:

```javascript
axios.get(url, {
	timeout: 10000, // 10 seconds
});
```

### Rate Limiting

Respect API rate limits:

```javascript
// Set appropriate collection intervals
const interval = parseInt(process.env.INTERVAL_SERVICE) || 60; // 60 min default
```

### Data Normalization

Keep response structures consistent:

```javascript
const normalized = {
	// Core data
	data_field: value,

	// Metadata
	last_updated: new Date().toISOString(),
};
```

### Logging

Use consistent logging:

```javascript
console.log("✅ Success message");
console.warn("⚠️  Warning message");
console.error("❌ Error message");
console.log("🔄 Loading message");
console.log("📦 Cache message");
```

## Common Patterns

### GraphQL API

```javascript
const query = {
	query: `
    query getData($param: String!) {
      data(param: $param) {
        field1
        field2
      }
    }
  `,
	variables: { param: value },
};

const response = await axios.post(GRAPHQL_ENDPOINT, query, {
	headers: { "Content-Type": "application/json" },
});
```

### Pagination

```javascript
async function fetchAllPages() {
	let allData = [];
	let page = 1;
	let hasMore = true;

	while (hasMore) {
		const response = await axios.get(url, {
			params: { page, per_page: 100 },
		});

		allData = allData.concat(response.data);
		hasMore = response.data.length === 100;
		page++;
	}

	return allData;
}
```

### Authentication Headers

```javascript
// Bearer Token
headers: {
  'Authorization': `Bearer ${apiKey}`
}

// Basic Auth
headers: {
  'Authorization': `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`
}

// API Key Header
headers: {
  'X-API-Key': apiKey
}
```

### Retry Logic

```javascript
async function fetchWithRetry(url, maxRetries = 3) {
	for (let i = 0; i < maxRetries; i++) {
		try {
			return await axios.get(url);
		} catch (error) {
			if (i === maxRetries - 1) throw error;
			await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
		}
	}
}
```

## Testing Your Collector

1. **Set environment variable:**

   ```bash
   export YOUR_SERVICE_API_KEY=your_key
   ```

2. **Test the collector directly:**

   ```javascript
   const { fetchYourServiceData } = require("./src/collectors/yourservice");
   fetchYourServiceData().then(console.log);
   ```

3. **Check the cache:**

   ```bash
   # Using redis-cli
   redis-cli GET stats:yourservice
   ```

4. **Test the API endpoint:**
   ```bash
   curl http://localhost:3000/stats/yourservice
   ```

## Example: GitHub Collector

Here's a complete example for a GitHub stats collector:

```javascript
const axios = require("axios");
const { setCache, getCache } = require("../cache/redis");

const GITHUB_API = "https://api.github.com";
const CACHE_KEY = "stats:github";
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 300;

async function fetchGitHubData() {
	try {
		const token = process.env.GITHUB_TOKEN;
		const username = process.env.GITHUB_USERNAME;

		if (!token || !username) {
			console.warn("⚠️  GitHub credentials not configured");
			return null;
		}

		console.log("🔄 Fetching GitHub data...");

		const headers = {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github.v3+json",
		};

		const [userResponse, reposResponse] = await Promise.all([
			axios.get(`${GITHUB_API}/users/${username}`, { headers }),
			axios.get(`${GITHUB_API}/users/${username}/repos?per_page=100`, {
				headers,
			}),
		]);

		const user = userResponse.data;
		const repos = reposResponse.data;

		const normalized = {
			user: {
				login: user.login,
				name: user.name,
				avatar_url: user.avatar_url,
				bio: user.bio,
				location: user.location,
				blog: user.blog,
				public_repos: user.public_repos,
				followers: user.followers,
				following: user.following,
			},
			stats: {
				total_stars: repos.reduce(
					(sum, repo) => sum + repo.stargazers_count,
					0
				),
				total_forks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
				languages: [...new Set(repos.map((r) => r.language).filter(Boolean))],
			},
			last_updated: new Date().toISOString(),
		};

		await setCache(CACHE_KEY, normalized, CACHE_TTL);
		console.log("✅ GitHub data updated");
		return normalized;
	} catch (error) {
		console.error("❌ Error fetching GitHub data:", error.message);
		const cached = await getCache(CACHE_KEY);
		if (cached) {
			console.log("📦 Returning cached GitHub data");
			return cached;
		}
		return null;
	}
}

async function getGitHubData() {
	const cached = await getCache(CACHE_KEY);
	if (cached) return cached;
	return await fetchGitHubData();
}

module.exports = {
	fetchGitHubData,
	getGitHubData,
	CACHE_KEY,
};
```

## Questions?

If you have questions or need help adding a new collector:

1. Check existing collectors for reference
2. Review the error logs for debugging
3. Test with a minimal example first
4. Open an issue on GitHub for support

Happy coding! 🚀
