# API Documentation

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://your-app.onrender.com`

## Authentication

No authentication required. All endpoints are public and read-only.

## Rate Limiting

Data is cached in Redis based on the `CACHE_TTL` setting (default: 5 minutes). Requests will return cached data within the TTL window.

## Response Format

All successful responses follow this structure:

```json
{
	"meta": {
		"generated_at": "2026-01-01T12:00:00.000Z"
	},
	"data": {
		// Endpoint-specific data
	}
}
```

Error responses:

```json
{
	"error": "Error type",
	"message": "Detailed error message"
}
```

---

## Endpoints

### 1. Root Endpoint

**GET /**

Returns API information and available endpoints.

**Response:**

```json
{
	"name": "Personal Stats API",
	"version": "1.0.0",
	"description": "Telemetry and stats aggregation API",
	"endpoints": {
		"all_stats": "/stats",
		"discord": "/stats/discord",
		"spotify": "/stats/spotify",
		"leetcode": "/stats/leetcode",
		"wakatime": "/stats/wakatime",
		"github": "/stats/github",
		"health": "/stats/health"
	},
	"status": "operational"
}
```

---

### 2. Health Check

**GET /health** or **GET /stats/health**

Check API and Redis connection status.

**Response:**

```json
{
	"status": "ok",
	"redis_connected": true,
	"timestamp": "2026-01-01T12:00:00.000Z",
	"uptime": 3600
}
```

---

### 3. All Stats (Aggregated)

**GET /stats**

Returns all data from all sources in a single response.

**Response:**

```json
{
	"meta": {
		"generated_at": "2026-01-01T12:00:00.000Z",
		"version": "1.0.0"
	},
	"data": {
		"discord": {
			/* Discord data */
		},
		"spotify": {
			/* Spotify data */
		},
		"leetcode": {
			/* LeetCode data */
		},
		"wakatime": {
			/* WakaTime data */
		},
		"github": {
			/* GitHub data */
		}
	}
}
```

---

### 4. Discord Presence

**GET /stats/discord**

Returns current Discord presence including status, activities, and Spotify integration.

**Response:**

```json
{
	"meta": {
		"generated_at": "2026-01-01T12:00:00.000Z"
	},
	"data": {
		"discord_user": {
			"id": "123456789012345678",
			"username": "yourname",
			"discriminator": "0001",
			"avatar": "abc123def456",
			"bot": false,
			"global_name": "Your Name"
		},
		"discord_status": "online",
		"active_on_discord_mobile": false,
		"active_on_discord_desktop": true,
		"active_on_discord_web": false,
		"listening_to_spotify": true,
		"spotify": {
			"track_id": "3n3Ppam7vgaVa1iaRUc9Lp",
			"timestamps": {
				"start": 1704110400000,
				"end": 1704110640000
			},
			"song": "Mr. Brightside",
			"artist": "The Killers",
			"album_art_url": "https://i.scdn.co/image/...",
			"album": "Hot Fuss"
		},
		"activities": [
			{
				"id": "spotify:1",
				"name": "Spotify",
				"type": 2,
				"state": "The Killers",
				"details": "Mr. Brightside",
				"created_at": 1704110400000
			}
		],
		"kv": {},
		"last_updated": "2026-01-01T12:00:00.000Z"
	}
}
```

**Activity Types:**

- `0` - Playing
- `1` - Streaming
- `2` - Listening
- `3` - Watching
- `4` - Custom
- `5` - Competing

**Discord Status Values:**

- `online` - Online
- `idle` - Idle
- `dnd` - Do Not Disturb
- `offline` - Offline/Invisible

---

### 9. GitHub: Profile & Activity

**GET /stats/github**

Returns GitHub profile, repos, language distribution, recent activity, and heatmap data.

Key fields:

- `commits_last_365_days`: Day-wise commit counts across non-fork repos.
  - `range_days`: 365
  - `total_commits`: integer
  - `daily`: array of `{ date: YYYY-MM-DD, commits: number }`
- `contributions_last_365_days`: Day-wise total contributions (GraphQL calendar; includes commits, PRs, issues). Useful fallback if commit heatmap is unavailable.
  - `range_days`: 365
  - `total_contributions`: integer
  - `daily`: array of `{ date: YYYY-MM-DD, contributions: number }`

---

### 10. GitHub: Commits Heatmap

**GET /stats/github/commits/daily**

Returns only the commit heatmap payload for the last 365 days.

Example response:

```json
{
	"meta": { "generated_at": "2026-01-10T12:00:00.000Z" },
	"data": {
		"range_days": 365,
		"total_commits": 1234,
		"daily": [
			{ "date": "2025-01-11", "commits": 0 },
			{ "date": "2025-01-12", "commits": 2 }
		],
		"note": "Counts commits authored by the user on default branches across non-fork repos"
	}
}
```

---

### 11. GitHub: Contributions Calendar (Fallback)

**GET /stats/github/contributions/daily**

GraphQL-derived daily totals (includes commits, PRs, issues). Use when commit-only heatmap is not available.

Example response:

```json
{
	"meta": { "generated_at": "2026-01-10T12:00:00.000Z" },
	"data": {
		"range_days": 365,
		"total_contributions": 2345,
		"daily": [
			{ "date": "2025-01-11", "contributions": 1 },
			{ "date": "2025-01-12", "contributions": 3 }
		],
		"note": "GraphQL calendar: includes commits, PRs, issues, etc."
	}
}
```

### 5. Spotify Now Playing

**GET /stats/spotify**

Returns current Spotify playback status (extracted from Discord presence).

**Response (When Listening):**

```json
{
	"meta": {
		"generated_at": "2026-01-01T12:00:00.000Z"
	},
	"data": {
		"listening": true,
		"current_track": {
			"track_id": "3n3Ppam7vgaVa1iaRUc9Lp",
			"song": "Mr. Brightside",
			"artist": "The Killers",
			"album": "Hot Fuss",
			"album_art_url": "https://i.scdn.co/image/...",
			"timestamps": {
				"start": 1704110400000,
				"end": 1704110640000
			},
			"duration": 240000,
			"progress": 120000
		},
		"last_updated": "2026-01-01T12:00:00.000Z"
	}
}
```

**Response (Not Listening):**

```json
{
	"meta": {
		"generated_at": "2026-01-01T12:00:00.000Z"
	},
	"data": {
		"listening": false,
		"current_track": null,
		"last_updated": "2026-01-01T12:00:00.000Z"
	}
}
```

---

### 6. LeetCode: Daily Submissions Heatmap

**GET /stats/leetcode/submissions/daily**

Returns day-wise submission counts for the last 365 days using LeetCode's public calendar API.

Example response:

```json
{
	"meta": { "generated_at": "2026-01-10T12:00:00.000Z" },
	"data": {
		"range_days": 365,
		"total_submissions": 456,
		"daily": [
			{ "date": "2025-01-11", "submissions": 0 },
			{ "date": "2025-01-12", "submissions": 3 }
		],
		"note": "Counts submissions per day from LeetCode calendar API"
	}
}
```

Included within the full LeetCode payload under `submissions_last_365_days`.

---

### 6. LeetCode Statistics

**GET /stats/leetcode**

Returns comprehensive LeetCode profile and problem-solving statistics.

**Response:**

```json
{
	"meta": {
		"generated_at": "2026-01-01T12:00:00.000Z"
	},
	"data": {
		"username": "yourname",
		"profile": {
			"real_name": "Your Name",
			"avatar": "https://assets.leetcode.com/users/...",
			"location": "San Francisco, CA",
			"country": "United States",
			"company": "Tech Company",
			"school": "University Name",
			"websites": ["https://yourwebsite.com"],
			"skill_tags": ["Dynamic Programming", "Algorithms", "Data Structures"],
			"about": "Software Engineer",
			"star_rating": 4.5,
			"ranking": 12345
		},
		"problems_solved": {
			"all": 450,
			"easy": 180,
			"medium": 220,
			"hard": 50
		},
		"total_submissions": {
			"all": 800,
			"easy": 250,
			"medium": 400,
			"hard": 150
		},
		"total_problems": {
			"all": 2500,
			"easy": 800,
			"medium": 1200,
			"hard": 500
		},
		"progress_percentage": {
			"easy": "22.50",
			"medium": "18.33",
			"hard": "10.00",
			"all": "18.00"
		},
		"acceptance_rate": "56.25",
		"contest_stats": {
			"attended": 25,
			"rating": 1850,
			"global_ranking": 5432,
			"top_percentage": "3.45",
			"history": [
				{
					"attended": true,
					"rating": 1850,
					"ranking": 234,
					"trendDirection": "UP",
					"problemsSolved": 3,
					"totalProblems": 4,
					"finishTimeInSeconds": 5400,
					"contest": {
						"title": "Weekly Contest 350",
						"startTime": 1704067200
					}
				}
			]
		},
		"last_updated": "2026-01-01T12:00:00.000Z"
	}
}
```

---

### 7. WakaTime Statistics

**GET /stats/wakatime**

Returns comprehensive coding statistics from WakaTime.

**Response:**

```json
{
	"meta": {
		"generated_at": "2026-01-01T12:00:00.000Z"
	},
	"data": {
		"user": {
			"id": "abc123-def456-ghi789",
			"username": "yourname",
			"display_name": "Your Name",
			"email": "your@email.com",
			"photo": "https://wakatime.com/photo/...",
			"website": "https://yourwebsite.com",
			"location": "San Francisco, CA",
			"created_at": "2020-01-01T00:00:00Z",
			"last_heartbeat_at": "2026-01-01T11:59:00Z",
			"last_plugin_name": "vscode-wakatime",
			"last_project": "personal-stats-api"
		},
		"stats_last_7_days": {
			"total_seconds": 126000,
			"daily_average": 18000,
			"human_readable_total": "35 hrs",
			"human_readable_daily_average": "5 hrs",
			"languages": [
				{
					"name": "JavaScript",
					"total_seconds": 63000,
					"percent": 50.0,
					"digital": "17:30",
					"text": "17 hrs 30 mins"
				},
				{
					"name": "Python",
					"total_seconds": 37800,
					"percent": 30.0,
					"digital": "10:30",
					"text": "10 hrs 30 mins"
				}
			],
			"editors": [
				{
					"name": "VS Code",
					"total_seconds": 113400,
					"percent": 90.0,
					"digital": "31:30",
					"text": "31 hrs 30 mins"
				}
			],
			"operating_systems": [
				{
					"name": "Mac",
					"total_seconds": 126000,
					"percent": 100.0,
					"digital": "35:00",
					"text": "35 hrs"
				}
			],
			"categories": [
				{
					"name": "Coding",
					"total_seconds": 113400,
					"percent": 90.0,
					"digital": "31:30",
					"text": "31 hrs 30 mins"
				}
			],
			"projects": [
				{
					"name": "personal-stats-api",
					"total_seconds": 45000,
					"percent": 35.71,
					"digital": "12:30",
					"text": "12 hrs 30 mins"
				}
			],
			"best_day": {
				"date": "2026-01-01",
				"total_seconds": 28800,
				"text": "8 hrs"
			}
		},
		"all_time": {
			"total_seconds": 5400000,
			"text": "1,500 hrs",
			"is_up_to_date": true
		},
		"daily_summaries": [
			{
				"date": "2026-01-01",
				"total_seconds": 28800,
				"text": "8 hrs",
				"digital": "08:00"
			}
		],
		"last_updated": "2026-01-01T12:00:00.000Z"
	}
}
```

---

### 8. GitHub Profile and Activity

**GET /stats/github**

Returns comprehensive GitHub profile, repository, and activity statistics.

**Response:**

```json
{
	"meta": {
		"generated_at": "2026-01-03T12:00:00.000Z"
	},
	"data": {
		"user": {
			"username": "yourname",
			"name": "Your Full Name",
			"avatar_url": "https://avatars.githubusercontent.com/u/12345678",
			"bio": "Software Engineer | Open Source Enthusiast",
			"location": "San Francisco, CA",
			"website": "https://yourwebsite.com",
			"company": "@YourCompany",
			"twitter_username": "yourhandle",
			"public_repos": 42,
			"public_gists": 15,
			"followers": 250,
			"following": 180,
			"created_at": "2015-01-15T00:00:00Z",
			"profile_url": "https://github.com/yourname"
		},
		"repository_metrics": {
			"total_repos": 42,
			"owned_repos": 35,
			"forked_repos": 7,
			"total_stars": 1250,
			"owned_stars": 1200,
			"total_forks": 340,
			"archived_count": 3,
			"note": "Metrics include both public and private repos visible to the token"
		},
		"top_repositories": [
			{
				"name": "awesome-project",
				"full_name": "yourname/awesome-project",
				"description": "A really awesome project that does amazing things",
				"url": "https://github.com/yourname/awesome-project",
				"stars": 450,
				"forks": 120,
				"language": "JavaScript",
				"created_at": "2020-03-15T00:00:00Z",
				"updated_at": "2026-01-02T10:30:00Z",
				"pushed_at": "2026-01-02T10:30:00Z",
				"is_fork": false,
				"is_archived": false,
				"topics": ["nodejs", "api", "open-source"]
			}
		],
		"language_distribution": [
			{
				"name": "JavaScript",
				"count": 18,
				"percent": "42.9"
			},
			{
				"name": "Python",
				"count": 12,
				"percent": "28.6"
			},
			{
				"name": "TypeScript",
				"count": 8,
				"percent": "19.0"
			}
		],
		"activity_last_30_days": {
			"period_days": 30,
			"commits_count": 156,
			"commits_note": "Estimated from push events (may undercount commits pushed before token creation)",
			"push_events": 45,
			"pull_requests_opened": 12,
			"pull_requests_merged": 10,
			"issues_opened": 8,
			"total_events": 234,
			"daily_timeline": [
				{
					"date": "2026-01-01",
					"events": 15
				},
				{
					"date": "2026-01-02",
					"events": 22
				}
			],
			"most_active_repos": [
				{
					"repo": "yourname/awesome-project",
					"events": 45
				},
				{
					"repo": "yourname/another-project",
					"events": 32
				}
			]
		},
		"contribution_signals": {
			"current_streak": 12,
			"longest_streak_in_period": 25,
			"active_days_in_period": 24,
			"note": "Calculated from recent events (up to 90 days, max 300 events)",
			"last_activity": "2026-01-03T08:45:00Z",
			"last_activity_human": "3 hours ago"
		},
		"rate_limit_note": "GitHub API has rate limits. Authenticated: 5000 req/hr. Data may be cached.",
		"last_updated": "2026-01-03T12:00:00.000Z"
	}
}
```

**Notes:**

- Activity metrics are based on the last 30 days of events
- Commit counts are estimated from push events (may undercount)
- Streaks are calculated from available event data (up to 90 days, max 300 events)
- Requires `GITHUB_TOKEN` environment variable
- Token needs `read:user` and optionally `repo` scope for private repos

---

## Error Responses

### 404 Not Found

```json
{
	"error": "Not Found",
	"message": "Route /invalid not found",
	"available_routes": [
		"/",
		"/health",
		"/stats",
		"/stats/discord",
		"/stats/spotify",
		"/stats/leetcode",
		"/stats/wakatime",
		"/stats/github"
	]
}
```

### 500 Internal Server Error

```json
{
	"error": "Failed to fetch stats",
	"message": "Connection timeout"
}
```

### Data Not Available

```json
{
	"error": "Discord data not available",
	"message": "Check if DISCORD_USER_ID is configured and you have joined the Lanyard Discord server"
}
```

---

## CORS

The API supports CORS and can be consumed from:

- Static sites (Netlify, GitHub Pages, Vercel)
- Frontend applications (React, Vue, Angular)
- Mobile applications
- Any origin (configurable via `ALLOWED_ORIGINS`)

**Default Headers:**

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

---

## Caching

- All data is cached in Redis
- Cache TTL is configurable (default: 300 seconds / 5 minutes)
- Stale data is served if external APIs fail
- Cache keys follow pattern: `stats:{source}`

**Cache Keys:**

- `stats:discord` - Discord presence
- `stats:leetcode` - LeetCode stats
- `stats:wakatime` - WakaTime stats
- `stats:github` - GitHub profile and activity

---

## Collection Schedule

Data is collected automatically at configurable intervals:

| Source          | Default Interval | Configurable Via    |
| --------------- | ---------------- | ------------------- |
| Discord/Spotify | 2 minutes        | `INTERVAL_DISCORD`  |
| LeetCode        | 60 minutes       | `INTERVAL_LEETCODE` |
| WakaTime        | 30 minutes       | `INTERVAL_WAKATIME` |
| GitHub          | 30 minutes       | `INTERVAL_GITHUB`   |

---

## Best Practices

1. **Cache Responses**: Implement client-side caching to reduce API calls
2. **Handle Errors**: Always check for error responses
3. **Check Availability**: Use the health endpoint before making requests
4. **Respect Limits**: Don't poll too frequently; data updates based on collection intervals
5. **Use Specific Endpoints**: Request only the data you need instead of `/stats`

---

## Example Integration

### Fetch with Error Handling

```javascript
async function getStats() {
	try {
		const response = await fetch("https://your-app.onrender.com/stats");

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const json = await response.json();
		return json.data;
	} catch (error) {
		console.error("Failed to fetch stats:", error);
		return null;
	}
}
```

### React Hook

```javascript
import { useState, useEffect } from "react";

function useStats() {
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetch("https://your-app.onrender.com/stats")
			.then((res) => res.json())
			.then((data) => setStats(data.data))
			.catch((err) => setError(err))
			.finally(() => setLoading(false));
	}, []);

	return { stats, loading, error };
}
```
