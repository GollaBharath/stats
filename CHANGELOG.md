# Changelog

All notable changes to this project will be documented in this file.

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
