# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        External Services                         │
├─────────────────────────────────────────────────────────────────┤
│  Discord/Lanyard  │  LeetCode API  │  WakaTime API  │  Spotify  │
└──────────┬──────────────────┬────────────────┬────────────┬─────┘
           │                  │                │            │
           │                  │                │            │
           ▼                  ▼                ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Data Collectors                         │
├─────────────────────────────────────────────────────────────────┤
│  discord.js    │  leetcode.js    │  wakatime.js  │  spotify.js  │
│  (2 min)       │  (60 min)       │  (30 min)     │  (via disc.) │
└──────────┬──────────────────┬────────────────┬─────────────────┬┘
           │                  │                │                 │
           │                  ▼                │                 │
           │        ┌─────────────────┐        │                 │
           └───────►│   Scheduler     │◄───────┘                 │
                    │  (node-cron)    │                          │
                    └────────┬────────┘                          │
                             │                                   │
                             ▼                                   │
                    ┌─────────────────┐                          │
                    │  Redis Cache    │◄─────────────────────────┘
                    │   (Upstash)     │
                    └────────┬────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Express API Server                         │
├─────────────────────────────────────────────────────────────────┤
│  Routes:                                                         │
│  • GET /                    - API Info                          │
│  • GET /health              - Health Check                      │
│  • GET /stats               - All Stats (Aggregated)            │
│  • GET /stats/discord       - Discord Presence                  │
│  • GET /stats/spotify       - Spotify Now Playing               │
│  • GET /stats/leetcode      - LeetCode Statistics               │
│  • GET /stats/wakatime      - WakaTime Statistics               │
└──────────┬──────────────────────────────────────────────────────┘
           │
           │ CORS Enabled
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Client Applications                      │
├─────────────────────────────────────────────────────────────────┤
│  Static Sites  │  React Apps  │  Mobile Apps  │  Dashboards    │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Data Collection (Scheduled)

```
┌──────────┐
│ Cron Job │ Triggers every N minutes
└────┬─────┘
     │
     ▼
┌──────────────┐
│  Collector   │ Fetches data from external API
└────┬─────────┘
     │
     ▼
┌──────────────┐
│  Normalize   │ Transforms to standard format
└────┬─────────┘
     │
     ▼
┌──────────────┐
│ Redis Cache  │ Stores with TTL
└──────────────┘
```

### 2. API Request (User-Initiated)

```
┌──────────┐
│  Client  │ Makes HTTP GET request
└────┬─────┘
     │
     ▼
┌──────────────┐
│  Express API │ Receives request
└────┬─────────┘
     │
     ▼
┌──────────────┐
│ Check Cache  │ Look for cached data
└────┬─────────┘
     │
     ├─ Cache Hit ──────────────┐
     │                          │
     └─ Cache Miss ────────┐    │
                           │    │
                           ▼    │
                  ┌──────────────┐
                  │   Collector   │
                  └──────┬────────┘
                         │
                         └────────┐
                                  │
                                  ▼
                         ┌──────────────┐
                         │ Return JSON  │
                         └──────────────┘
```

## Component Responsibilities

### index.js (Main Application)

- Initialize Express server
- Configure CORS
- Mount routes
- Health checks
- Error handling
- Graceful shutdown

### scheduler.js (Cron Manager)

- Schedule data collection jobs
- Configure intervals per source
- Run initial data fetch
- Coordinate all collectors

### cache/redis.js (Cache Manager)

- Redis connection management
- Get/Set operations
- TTL management
- Error handling
- Connection pooling

### collectors/\*.js (Data Sources)

Each collector:

- Fetches data from external API
- Handles authentication
- Normalizes data structure
- Caches results
- Fallback to cache on errors
- Retry logic
- Timeout handling

### routes/stats.js (API Endpoints)

- Define HTTP routes
- Validate requests
- Retrieve cached data
- Format responses
- Error responses

## Deployment Architecture (Render)

```
┌─────────────────────────────────────────────────────────┐
│                      Render Platform                     │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         Web Service (Free Tier)                │    │
│  │                                                 │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │     Node.js Process                   │     │    │
│  │  │                                       │     │    │
│  │  │  • Express Server (PORT from env)    │     │    │
│  │  │  • Cron Jobs (in-process)            │     │    │
│  │  │  • Data Collectors                   │     │    │
│  │  └──────────┬───────────────────────────┘     │    │
│  │             │                                  │    │
│  │             │ HTTPS                            │    │
│  │             │                                  │    │
│  └─────────────┼──────────────────────────────────┘    │
│                │                                        │
└────────────────┼────────────────────────────────────────┘
                 │
                 │ TLS/SSL (Auto)
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
    ┌─────────┐    ┌──────────────┐
    │ Clients │    │    Upstash   │
    └─────────┘    │ Redis Cloud  │
                   └──────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layers                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. CORS Policy                                         │
│     └─ Configurable origins                             │
│     └─ Preflight handling                               │
│                                                          │
│  2. Environment Variables                               │
│     └─ No hardcoded credentials                         │
│     └─ Render secrets management                        │
│                                                          │
│  3. Read-Only API                                       │
│     └─ Only GET requests allowed                        │
│     └─ No data modification                             │
│                                                          │
│  4. Rate Limiting (Natural)                             │
│     └─ Caching reduces API calls                        │
│     └─ Configurable intervals                           │
│                                                          │
│  5. Error Handling                                      │
│     └─ No sensitive data in errors                      │
│     └─ Graceful degradation                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Caching Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    Cache Strategy                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Key Pattern: stats:{source}                            │
│                                                          │
│  ┌─────────────────────┬────────────┬─────────────┐    │
│  │ Source              │ Cache Key  │ Default TTL │    │
│  ├─────────────────────┼────────────┼─────────────┤    │
│  │ Discord/Spotify     │ :discord   │ 300s        │    │
│  │ LeetCode            │ :leetcode  │ 300s        │    │
│  │ WakaTime            │ :wakatime  │ 300s        │    │
│  └─────────────────────┴────────────┴─────────────┘    │
│                                                          │
│  Cache Invalidation:                                    │
│  • Time-based (TTL)                                     │
│  • Overwritten on successful fetch                      │
│  • Preserved on fetch failure (stale data better)       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Scaling Considerations

### Current (Free Tier)

- Single Render instance
- Upstash Redis (free 10k requests/day)
- In-process cron jobs
- ~15 min spin-down on inactivity

### Future Scaling Options

```
1. Horizontal Scaling
   └─ Multiple Render instances
   └─ Load balancer
   └─ Shared Redis cache

2. Vertical Scaling
   └─ Larger Render instance
   └─ More Redis memory
   └─ Faster response times

3. Optimization
   └─ Longer cache TTL
   └─ CDN for static responses
   └─ Response compression
   └─ Database for historical data
```

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────────┐
│                  Monitoring Points                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Health Endpoint                                     │
│     • /health returns status + Redis connection         │
│     • Use with UptimeRobot / Pingdom                    │
│                                                          │
│  2. Application Logs                                    │
│     • Render dashboard shows logs                       │
│     • Collector success/failure logs                    │
│     • API request logs                                  │
│                                                          │
│  3. Redis Metrics                                       │
│     • Upstash dashboard                                 │
│     • Request count, memory usage                       │
│                                                          │
│  4. Response Times                                      │
│     • Cache hit: <50ms                                  │
│     • Cache miss: <2s                                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Development vs Production

```
┌──────────────────────┬──────────────────────────────────┐
│   Development        │         Production               │
├──────────────────────┼──────────────────────────────────┤
│ • Local Redis        │ • Upstash Redis                  │
│ • nodemon hot reload │ • node process                   │
│ • Verbose logging    │ • Production logging             │
│ • localhost:3000     │ • *.onrender.com                 │
│ • .env file          │ • Render env vars                │
│ • No SSL             │ • Auto SSL/TLS                   │
└──────────────────────┴──────────────────────────────────┘
```

## Technology Choices Explained

### Why Express?

- Simple and lightweight
- Large ecosystem
- Easy to extend
- Perfect for APIs

### Why Redis?

- Fast in-memory storage
- Built-in TTL support
- Upstash offers free tier
- Minimal latency

### Why node-cron?

- In-process scheduling
- No external dependencies
- Works on Render free tier
- Simple configuration

### Why Axios?

- Promise-based
- Automatic JSON parsing
- Timeout support
- Good error handling

### Why CommonJS (not ESM)?

- Better compatibility
- Simpler require syntax
- No experimental flags needed
- Works everywhere

## Error Handling Flow

```
┌─────────────┐
│ API Request │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Check Cache │
└──────┬──────┘
       │
       ├─ Cache Hit ─────► Return Data
       │
       └─ Cache Miss
              │
              ▼
       ┌─────────────┐
       │ Fetch Fresh │
       └──────┬──────┘
              │
              ├─ Success ───► Cache & Return
              │
              └─ Failure
                     │
                     ▼
              ┌────────────┐
              │ Check Old  │
              │  Cache     │
              └──────┬─────┘
                     │
                     ├─ Has Stale ──► Return Stale
                     │
                     └─ No Cache ───► Return Error
```

## Request/Response Lifecycle

```
1. Client Request
   └─ HTTP GET to /stats/leetcode

2. Express Middleware
   └─ CORS headers
   └─ Request logging

3. Route Handler
   └─ Call getLeetCodeData()

4. Data Retrieval
   └─ Check Redis cache
   └─ Return if exists

5. Format Response
   └─ Add meta object
   └─ Wrap data

6. Send Response
   └─ JSON stringify
   └─ Set headers
   └─ Return to client

Total Time: 20-50ms (cached)
```

---

This architecture is designed for:

- ✅ Simplicity
- ✅ Reliability
- ✅ Low cost
- ✅ Easy maintenance
- ✅ Future extensibility
