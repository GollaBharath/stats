# Quick Reference Card

## 🚀 Quick Start Commands

```bash
# Setup
npm install
cp .env.example .env
# Edit .env with your credentials

# Development
npm run dev              # Start with hot reload
npm start                # Start production mode

# Testing
./test.sh                # Run health checks
curl localhost:3000      # Test API root
```

## 📋 Environment Variables Checklist

```bash
# Required
✓ REDIS_URL              # From Upstash
✓ DISCORD_USER_ID        # From Discord
✓ LEETCODE_USERNAME      # Your username
✓ WAKATIME_API_KEY       # From WakaTime

# Optional (has defaults)
○ PORT                   # Default: 3000
○ INTERVAL_DISCORD       # Default: 2 minutes
○ INTERVAL_LEETCODE      # Default: 60 minutes
○ INTERVAL_WAKATIME      # Default: 30 minutes
○ ALLOWED_ORIGINS        # Default: *
○ CACHE_TTL              # Default: 300 seconds
```

## 🔗 API Endpoints

| Endpoint              | Description      | Response Time |
| --------------------- | ---------------- | ------------- |
| `GET /`               | API info         | <50ms         |
| `GET /health`         | Health check     | <50ms         |
| `GET /stats`          | All stats        | 50-100ms      |
| `GET /stats/discord`  | Discord presence | <50ms         |
| `GET /stats/spotify`  | Spotify playing  | <50ms         |
| `GET /stats/leetcode` | LeetCode stats   | <50ms         |
| `GET /stats/wakatime` | WakaTime stats   | <50ms         |

## 🔧 Common Tasks

### Check Server Status

```bash
curl http://localhost:3000/health
```

### View Logs (Development)

```bash
npm run dev
# Logs appear in console
```

### View Logs (Production/Render)

- Go to Render Dashboard
- Select your service
- Click "Logs" tab

### Test Specific Endpoint

```bash
curl http://localhost:3000/stats/leetcode | jq
```

### Check Redis Connection

```bash
curl http://localhost:3000/health | jq '.redis_connected'
```

## 🐛 Troubleshooting

### Server won't start

```bash
# Check port is free
lsof -i :3000

# Check syntax
node -c src/index.js

# Check dependencies
npm install
```

### Redis connection fails

```bash
# Verify REDIS_URL in .env
echo $REDIS_URL

# Test Redis (if using local)
redis-cli ping
```

### No data returned (404)

```bash
# Check environment variables
cat .env | grep -v "^#" | grep -v "^$"

# Wait for initial data collection
# (Runs on startup, takes ~5 seconds)
```

### Collector fails

```bash
# Check logs for specific error
npm run dev

# Verify API credentials
# Check .env has correct values
```

## 📱 Client Integration Examples

### JavaScript/Fetch

```javascript
const res = await fetch("https://your-app.onrender.com/stats");
const { data } = await res.json();
console.log(data.leetcode.problems_solved);
```

### React Hook

```javascript
const [stats, setStats] = useState(null);
useEffect(() => {
	fetch("https://your-app.onrender.com/stats")
		.then((res) => res.json())
		.then((data) => setStats(data.data));
}, []);
```

### cURL with jq

```bash
curl -s https://your-app.onrender.com/stats/spotify | jq '.data.current_track'
```

## 🔐 Security Best Practices

```bash
# Never commit .env
echo ".env" >> .gitignore

# Use environment variables
export WAKATIME_API_KEY=waka_xxx

# Restrict CORS in production
ALLOWED_ORIGINS=https://yourdomain.com

# Use HTTPS (automatic on Render)
# Check SSL: https://your-app.onrender.com
```

## 📊 Monitoring

### Uptime Monitoring

```bash
# Use services like:
# - UptimeRobot (free)
# - Pingdom
# - Better Uptime

# Monitor endpoint:
https://your-app.onrender.com/health
```

### Response Time

```bash
# Measure locally
curl -w "Time: %{time_total}s\n" -o /dev/null -s http://localhost:3000/stats

# Expected times:
# Cached: 20-50ms
# Fresh: 200-2000ms
```

## 🚢 Deployment Checklist

### Pre-Deployment

- [ ] All dependencies installed
- [ ] .env.example updated with all variables
- [ ] All syntax checks pass
- [ ] Local testing complete
- [ ] README.md updated
- [ ] Committed to Git

### Render Setup

- [ ] Repository connected
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] Environment variables added
- [ ] Health check path: `/health`

### Post-Deployment

- [ ] Service starts successfully
- [ ] Health check passes
- [ ] All endpoints return data
- [ ] CORS working from frontend
- [ ] Logs show no errors

## 📚 Documentation Files

| File                 | Purpose              |
| -------------------- | -------------------- |
| `README.md`          | Main setup guide     |
| `API_DOCS.md`        | API documentation    |
| `CONTRIBUTING.md`    | Extension guide      |
| `ARCHITECTURE.md`    | System architecture  |
| `PROJECT_SUMMARY.md` | Complete overview    |
| `.env.example`       | Environment template |

## 🎯 Performance Targets

```
Response Time (Cached):     < 100ms
Response Time (Fresh):      < 2000ms
Cache Hit Rate:             > 90%
Uptime:                     > 99%
Memory Usage:               < 100MB
API Calls/Day:              < 1000
```

## 🔄 Update Intervals

| Source   | Default | Min    | Max      |
| -------- | ------- | ------ | -------- |
| Discord  | 2 min   | 1 min  | 60 min   |
| LeetCode | 60 min  | 15 min | 1440 min |
| WakaTime | 30 min  | 15 min | 360 min  |

## 💡 Pro Tips

1. **Cache Duration**: Increase `CACHE_TTL` to reduce API calls
2. **Update Intervals**: Match to data freshness needs
3. **CORS Origins**: Restrict in production for security
4. **Health Checks**: Use to prevent Render spin-down
5. **Error Logs**: Monitor for API rate limits
6. **Redis Keys**: Use `redis-cli KEYS stats:*` to debug
7. **Response Size**: Add fields carefully (affects bandwidth)

## 🆘 Support

- **Logs**: Check Render dashboard or local console
- **Health**: Always start with `/health` endpoint
- **Testing**: Use `./test.sh` for comprehensive check
- **Issues**: Check GitHub issues or create new one
- **Docs**: Read API_DOCS.md for detailed examples

## 🎨 Example Use Cases

- Personal portfolio stats display
- GitHub profile README widgets
- Dashboard websites
- Mobile app data source
- Discord bot integration
- Slack status updates
- Terminal dashboards (wtfutil, etc.)

---

**Remember**: All data is cached - changes may take up to `CACHE_TTL` seconds to appear!
