# Quick Reference

## 🚀 Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

## 📋 Required Environment Variables

```bash
UPSTASH_REDIS_REST_URL        # Upstash Redis REST URL
UPSTASH_REDIS_REST_TOKEN      # Upstash Redis Token
DISCORD_USER_ID               # Your Discord User ID
SPOTIFY_CLIENT_ID             # Spotify App Client ID
SPOTIFY_CLIENT_SECRET         # Spotify App Secret
SPOTIFY_REFRESH_TOKEN         # Spotify Refresh Token
LEETCODE_USERNAME             # Your LeetCode username
WAKATIME_API_KEY              # Your WakaTime API key
GITHUB_TOKEN                  # GitHub personal access token
```

## 🔗 API Endpoints

| Endpoint              | Description            |
| --------------------- | ---------------------- |
| `GET /`               | API information        |
| `GET /health`         | Health check           |
| `GET /stats`          | All stats (aggregated) |
| `GET /stats/discord`  | Discord presence       |
| `GET /stats/spotify`  | Currently playing      |
| `GET /stats/leetcode` | LeetCode stats         |
| `GET /stats/wakatime` | WakaTime coding stats  |
| `GET /stats/github`   | GitHub profile & stats |

## 🛠️ Common Commands

```bash
# Development
npm run dev               # Start with hot reload
npm start                 # Production mode

# Testing
curl localhost:3000/health
curl localhost:3000/stats | jq

# Spotify Setup
SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=xxx node setup-spotify.js
```

## 📊 Default Collection Intervals

- **Discord**: Every 2 minutes
- **Spotify**: Every 2 minutes
- **LeetCode**: Every 60 minutes
- **WakaTime**: Every 30 minutes
- **GitHub**: Every 30 minutes

Configure via `INTERVAL_*` environment variables.

## ✨ New Features (v1.1.0)

### WakaTime All-Time Stats

Access real all-time coding statistics:

```javascript
const { all_time_stats } = data.wakatime;
// {
//   total_seconds: 3400705,
//   text: "944 hrs 38 mins",
//   daily_average: 9317,
//   daily_average_text: "2 hrs 35 mins",
//   source: "wakatime_all_time_api"
// }
```

### GitHub Commit Time Distribution

See when you code most actively:

```javascript
const { time_distribution } = data.github.commits_last_365_days;
// {
//   total_commits: 1234,
//   distribution: {
//     morning: { count: 123, percent: "10.0", hours: "6:00 - 12:00" },
//     daytime: { count: 567, percent: "46.0", hours: "12:00 - 18:00" },
//     evening: { count: 432, percent: "35.0", hours: "18:00 - 24:00" },
//     night: { count: 112, percent: "9.0", hours: "0:00 - 6:00" }
//   }
// }
```

## 🔧 Troubleshooting

**Redis fails**: Check Upstash REST URL and token  
**Spotify null**: Run `setup-spotify.js` to get refresh token  
**WakaTime 401**: Regenerate API key from WakaTime settings  
**Discord null**: Join Lanyard Discord server first

## 🚢 Render Deployment

1. Connect GitHub repository
2. Build command: `npm install`
3. Start command: `npm start`
4. Add all environment variables
5. Deploy

**Note**: Free tier spins down after 15 min inactivity.

## 📱 Usage Example

```javascript
const res = await fetch("https://your-app.onrender.com/stats");
const { data } = await res.json();
console.log(data.spotify.current_track);
```

## 📚 Documentation

- **README.md** - Complete setup guide
- **API_DOCS.md** - Full API documentation
- **CHANGELOG.md** - Version history
