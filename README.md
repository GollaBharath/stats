# Personal Stats API 📊

A powerful personal telemetry and stats aggregation backend that collects data from multiple platforms and exposes it through a fast, read-only JSON API. Perfect for building personal dashboards and static sites.

## Architecture 🏗️

A simple, monolithic Node.js backend that collects and caches data from multiple platforms:

```
Express Server
    |
    +---> Scheduler (cron jobs)
    |          |
    |          v
    |     Collectors (Discord, Spotify, LeetCode, WakaTime, GitHub)
    |          |
    +----------+
               |
         Redis Cache
               |
         API Endpoints
```

**Benefits**:

- Simple deployment (single service)
- Automatic data collection on schedule
- Fast API responses from Redis cache
- Free tier friendly

## Features ✨

- **Multi-Platform Data Collection**: Aggregates data from Discord, Spotify, LeetCode, WakaTime, and GitHub
- **Real-Time Updates**: Configurable cron jobs with different intervals for each data source
- **Redis Caching**: Fast response times using Upstash Redis
- **CORS-Enabled**: Safe to consume from static sites (Netlify, GitHub Pages, etc.)
- **Deployment Ready**: Optimized for Render free tier
- **No Hardcoded Data**: Fully configurable via environment variables
- **Extensible**: Easy to add new data sources

## Data Sources 📡

### 1. Discord Presence (via Lanyard)

- Real-time Discord status and activities
- Rich presence data
- Updates every 2 minutes (configurable)

### 2. Spotify (Official API)

- Currently playing track
- Artist and album information
- Album artwork and track details
- Playback progress and duration

### 3. LeetCode

- Problems solved by difficulty
- Contest statistics and ranking
- Global ranking and percentile
- Acceptance rate and submission stats

### 4. WakaTime

- Coding time statistics (last 7 days & all-time)
- Language breakdown
- Editor and OS usage
- Projects and categories
- Daily summaries

### 5. GitHub

- User profile information
- Repository metrics (stars, forks, language distribution)
- Activity stats (commits, PRs, issues in last 30 days)
- Contribution signals (streak estimation, most active repos)
- Top repositories by stars

## Quick Start 🚀

### Prerequisites

- Node.js 16+ and npm
- Redis instance (recommended: [Upstash](https://upstash.com/) free tier)
- API keys and credentials (see below)

### Local Development

1. **Clone the repository**

   ```bash
   git clone https://github.com/GollaBharath/stats.git
   cd stats
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your credentials (see [Configuration](#configuration) section)

4. **Start the development server**

   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3000`

## Configuration ⚙️

### Required API Keys and Setup

#### 1. Upstash Redis

- **URL**: https://console.upstash.com/
- **Steps**:
  1. Create a free account
  2. Create a new Redis database
  3. Copy the REST URL and REST TOKEN
  4. Add to `.env` as `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

#### 2. Discord (Lanyard)

- **URL**: https://discord.gg/lanyard
- **Steps**:
  1. Join the Lanyard Discord server
  2. Enable Developer Mode in Discord (Settings → Advanced → Developer Mode)
  3. Right-click your profile and select "Copy User ID"
  4. Add to `.env` as `DISCORD_USER_ID`

#### 3. Spotify (Official API)

- **URL**: https://developer.spotify.com/dashboard
- **Steps**:
  1. Go to Spotify Developer Dashboard
  2. Create a new app
  3. Add redirect URI: `http://localhost:8888/callback`
  4. Copy Client ID and Client Secret
  5. Run: `SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=xxx node setup-spotify.js`
  6. Authorize in browser and copy the refresh token
  7. Add all three to `.env`: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`

#### 4. LeetCode

- **No API key required!**
- **Steps**:
  1. Find your LeetCode username (visible in your profile URL)
  2. Add to `.env` as `LEETCODE_USERNAME`

#### 5. WakaTime

- **URL**: https://wakatime.com/settings/api-key
- **Steps**:
  1. Sign up/login at WakaTime
  2. Go to Settings → API Key
  3. Copy your Secret API Key
  4. Add to `.env` as `WAKATIME_API_KEY`

#### 6. GitHub

- **URL**: https://github.com/settings/tokens
- **Steps**:
  1. Go to GitHub Settings → Developer Settings → Personal access tokens → Tokens (classic)
  2. Click "Generate new token (classic)"
  3. Give it a descriptive name (e.g., "Personal Stats API")
  4. Select scopes: `read:user`, `repo` (for private repo stats), `read:org` (optional)
  5. Generate and copy the token
  6. Add to `.env` as `GITHUB_TOKEN`
- **Note**: The token only needs read access. For public-only stats, `read:user` and `public_repo` suffice.

### Environment Variables

| Variable                   | Required | Default     | Description                            |
| -------------------------- | -------- | ----------- | -------------------------------------- |
| `PORT`                     | No       | 3000        | Server port                            |
| `NODE_ENV`                 | No       | development | Environment mode                       |
| `UPSTASH_REDIS_REST_URL`   | Yes      | -           | Upstash Redis REST URL                 |
| `UPSTASH_REDIS_REST_TOKEN` | Yes      | -           | Upstash Redis REST Token               |
| `DISCORD_USER_ID`          | Yes      | -           | Your Discord user ID                   |
| `SPOTIFY_CLIENT_ID`        | Yes      | -           | Spotify app client ID                  |
| `SPOTIFY_CLIENT_SECRET`    | Yes      | -           | Spotify app client secret              |
| `SPOTIFY_REFRESH_TOKEN`    | Yes      | -           | Spotify refresh token                  |
| `LEETCODE_USERNAME`        | Yes      | -           | Your LeetCode username                 |
| `WAKATIME_API_KEY`         | Yes      | -           | Your WakaTime API key                  |
| `GITHUB_TOKEN`             | Yes      | -           | GitHub personal access token           |
| `INTERVAL_DISCORD`         | No       | 2           | Discord collection interval (minutes)  |
| `INTERVAL_SPOTIFY`         | No       | 2           | Spotify collection interval (minutes)  |
| `INTERVAL_LEETCODE`        | No       | 60          | LeetCode collection interval (minutes) |
| `INTERVAL_WAKATIME`        | No       | 30          | WakaTime collection interval (minutes) |
| `INTERVAL_GITHUB`          | No       | 30          | GitHub collection interval (minutes)   |
| `ALLOWED_ORIGINS`          | No       | \*          | CORS allowed origins (comma-separated) |
| `CACHE_TTL`                | No       | 300         | Cache time-to-live (seconds)           |

## API Endpoints 🔌

### Base URL

- Local: `http://localhost:3000`
- Production: `https://your-app.onrender.com`

### Available Endpoints

| Endpoint              | Description                             | Response                       |
| --------------------- | --------------------------------------- | ------------------------------ |
| `GET /`               | API information and available endpoints | API metadata                   |
| `GET /health`         | Health check and Redis status           | Service health                 |
| `GET /stats`          | All stats aggregated                    | Combined data from all sources |
| `GET /stats/discord`  | Discord presence data                   | Real-time Discord status       |
| `GET /stats/spotify`  | Current Spotify playback                | Now playing information        |
| `GET /stats/leetcode` | LeetCode statistics                     | Problem-solving stats          |
| `GET /stats/wakatime` | WakaTime coding stats                   | Coding activity data           |
| `GET /stats/github`   | GitHub profile and activity             | Repository and activity stats  |

### Example Response

```json
{
  "meta": {
    "generated_at": "2026-01-01T00:00:00.000Z",
    "version": "1.0.0"
  },
  "data": {
    "discord": { ... },
    "spotify": { ... },
    "leetcode": { ... },
    "wakatime": { ... },
    "github": { ... }
  }
}
```

## Deployment on Render 🚢

### Using render.yaml (Recommended)

The repository includes a `render.yaml` file for automatic deployment:

1. Go to [render.com](https://render.com/) and sign up
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will detect `render.yaml` and create the web service
5. Add your environment variables in the Render dashboard
6. Deploy!

### Manual Setup (Alternative)

1. Click "New +" → "Web Service"
2. Connect repository
3. Configure:
   - Name: `personal-stats-api`
   - Build: `npm install`
   - Start: `npm start`
4. Add all environment variables from `.env.example`
5. Deploy!

### Important Notes for Render

- **Free tier limitations**:
  - Service spins down after 15 minutes of inactivity
  - First request after spin-down takes ~30 seconds
- **PORT variable**: Render automatically provides `PORT` - don't override it
- **Persistent data**: Use Upstash Redis for data persistence

## Usage Examples 💡

### JavaScript/TypeScript

```javascript
// Fetch all stats
const response = await fetch("https://your-app.onrender.com/stats");
const data = await response.json();
console.log(data);

// Fetch only Spotify data
const spotify = await fetch("https://your-app.onrender.com/stats/spotify");
const nowPlaying = await spotify.json();
```

### React Component

```jsx
function StatsDisplay() {
	const [stats, setStats] = useState(null);

	useEffect(() => {
		fetch("https://your-app.onrender.com/stats")
			.then((res) => res.json())
			.then((data) => setStats(data.data));
	}, []);

	return (
		<div>
			{stats?.spotify?.listening && (
				<p>Now playing: {stats.spotify.current_track.song}</p>
			)}
		</div>
	);
}
```

### Static Site (HTML)

```html
<script>
	fetch("https://your-app.onrender.com/stats/leetcode")
		.then((res) => res.json())
		.then((data) => {
			document.getElementById("problems-solved").textContent =
				data.data.problems_solved.all;
		});
</script>
```

## Project Structure 📁

```
stats/
├── src/
│   ├── index.js              # Express API server + scheduler
│   ├── scheduler.js          # Cron job scheduler
│   ├── cache/
│   │   └── redis.js          # Upstash Redis manager
│   ├── collectors/
│   │   ├── discord.js        # Discord/Lanyard collector
│   │   ├── spotify.js        # Spotify Official API collector
│   │   ├── leetcode.js       # LeetCode GraphQL collector
│   │   └── wakatime.js       # WakaTime API collector
│   └── routes/
│       └── stats.js          # API route handlers
├── render.yaml               # Render deployment config
├── setup-spotify.js          # Spotify OAuth helper script
├── .env.example              # Environment template
├── package.json
└── README.md
```

### Running Locally

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## Adding New Data Sources 🔧

The architecture is designed for easy extensibility:

1. **Create a new collector** in `src/collectors/`
2. **Add the fetch logic** with caching
3. **Update the scheduler** in `src/scheduler.js`
4. **Add a route** in `src/routes/stats.js`
5. **Update environment variables** in `.env.example`

Example collector template:

```javascript
const axios = require("axios");
const { setCache, getCache } = require("../cache/redis");

const CACHE_KEY = "stats:myservice";
const CACHE_TTL = 300;

async function fetchMyServiceData() {
	try {
		const response = await axios.get("https://api.example.com/data");
		const normalized = {
			/* normalize data */
		};
		await setCache(CACHE_KEY, normalized, CACHE_TTL);
		return normalized;
	} catch (error) {
		return await getCache(CACHE_KEY);
	}
}

module.exports = { fetchMyServiceData };
```

## Troubleshooting 🔍

### Common Issues

**Redis connection fails**

- Verify your `REDIS_URL` is correct
- Verify your Upstash REST URL and token are correct
- Check Upstash dashboard for database status

**Discord data returns null**

- Make sure you've joined the Lanyard Discord server
- Verify your `DISCORD_USER_ID` is correct

**Spotify returns null**

- Verify all three Spotify credentials are set
- Regenerate refresh token using `setup-spotify.js`
- Make sure you're actually playing music

**LeetCode data not updating**

- Verify your username is correct (case-sensitive)
- Check if your profile is public

**WakaTime returns 401 error**

- Regenerate your API key from WakaTime settings
- Ensure the key starts with `waka_`

- **Caching**: All data is cached in Redis to minimize API calls
- **Rate Limiting**: Configure intervals appropriately to avoid rate limits
- **Error Handling**: Graceful fallback to cached data on API failures
- **Monitoring**: Use `/health` endpoint for uptime monitoring
- **Security**: Never commit `.env` file or expose API keys

## Contributing 🤝

This is a personal project template, but you're welcome to:

- Fork and customize for your own use
- Submit issues for bugs or suggestions
- Share improvements and optimizations

## License 📄

MIT License - feel free to use this project for your personal dashboard!
Feel free to fork and customize for your own use. Submit issues for bugs or suggestions.

## License 📄

MIT Licens
