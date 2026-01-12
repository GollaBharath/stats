# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-01-12

### Added

- ✨ **WakaTime all-time statistics**: Now fetches real all-time coding stats from WakaTime API (`/users/current/all_time_since_today`)
  - Added `all_time_stats` field with total seconds, daily average, and source indicator
  - Maintains backward compatibility with `derived_all_time_estimate`
  - Falls back to estimated stats if all-time API is unavailable
- ✨ **GitHub commit time distribution**: Analyzes commits by time of day
  - Categorizes commits into 4 periods: morning (6-12), daytime (12-18), evening (18-24), night (0-6)
  - Provides count, percentage, and sample commits for each period
  - Available in `commits_last_365_days.time_distribution`
  - Includes recent commit samples (up to 5 per period)

### Changed

- 📊 Enhanced WakaTime response structure with comprehensive all-time data
- 📊 Improved GitHub commit heatmap with time distribution analysis
- 📝 Updated API documentation with new data structures and examples

### Technical Details

- Added `categorizeCommitsByTimeOfDay()` function in GitHub collector
- Modified `fetchWakaTimeData()` to include all-time API call
- Enhanced commit collection to store full commit objects for analysis
- All new features respect existing rate limits and caching strategies

---

## [1.0.0] - 2026-01-02

### Features

- ✅ Discord presence collector via Lanyard API
- ✅ Spotify Official API integration with OAuth2
- ✅ LeetCode statistics collector (GraphQL API)
- ✅ WakaTime coding statistics collector (Basic Auth)
- ✅ Upstash Redis caching (REST API)
- ✅ Express API server with CORS support
- ✅ Scheduled data collection with node-cron
- ✅ Configurable collection intervals
- ✅ Health check endpoint
- ✅ Graceful error handling and cached fallbacks

### API Endpoints

- `GET /` - API information
- `GET /health` - Health check and Redis status
- `GET /stats` - All stats aggregated
- `GET /stats/discord` - Discord presence data
- `GET /stats/spotify` - Currently playing track
- `GET /stats/leetcode` - LeetCode statistics
- `GET /stats/wakatime` - WakaTime coding stats

### Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 5.x
- **Cache**: Upstash Redis (REST API)
- **Scheduler**: node-cron
- **HTTP Client**: Axios
- **Deployment**: Render (free tier)

### Configuration

- Environment-based configuration via `.env`
- Configurable collection intervals per data source
- CORS support for static site integration
- Configurable cache TTL (default: 5 minutes)

### Deployment

- Render deployment configuration (`render.yaml`)
- Health check endpoint for monitoring
- Upstash Redis for serverless persistence
- Auto-deploy from GitHub
