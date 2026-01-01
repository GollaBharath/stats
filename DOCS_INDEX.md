# Documentation Index

Welcome to the Personal Stats API documentation! This index helps you find the information you need quickly.

## 📖 Getting Started

Start here if you're new to the project:

1. **[README.md](README.md)** - Main documentation

   - Project overview
   - Features and capabilities
   - Quick start guide
   - Setup instructions
   - Deployment guide
   - API endpoints overview
   - Usage examples

2. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick reference card

   - Common commands
   - Environment variables checklist
   - Troubleshooting guide
   - Performance targets
   - Pro tips

3. **[setup.sh](setup.sh)** - Interactive setup script
   - Automated .env creation
   - Dependency installation
   - Quick start

## 🔌 API Documentation

Everything about using the API:

1. **[API_DOCS.md](API_DOCS.md)** - Complete API reference

   - All endpoint documentation
   - Request/response examples
   - Error codes and messages
   - CORS configuration
   - Caching strategy
   - Rate limiting
   - Best practices
   - Client integration examples

2. **Endpoints Summary**:
   - `GET /` - API information
   - `GET /health` - Health check
   - `GET /stats` - All stats aggregated
   - `GET /stats/discord` - Discord presence
   - `GET /stats/spotify` - Spotify playback
   - `GET /stats/leetcode` - LeetCode statistics
   - `GET /stats/wakatime` - WakaTime statistics

## 🏗️ Architecture & Technical Details

For understanding how it works:

1. **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture

   - System diagrams
   - Data flow
   - Component responsibilities
   - Deployment architecture
   - Security architecture
   - Caching strategy
   - Scaling considerations
   - Technology choices

2. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete project overview
   - What was built
   - Project structure
   - Key features
   - Performance characteristics
   - Next steps

## 🤝 Contributing & Extending

For developers who want to add features:

1. **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guide

   - Adding new data sources
   - Step-by-step tutorial
   - Best practices
   - Common patterns
   - Testing guidelines
   - Example implementations

2. **Code Structure**:
   ```
   src/
   ├── index.js           # Main Express app
   ├── scheduler.js       # Cron job manager
   ├── cache/
   │   └── redis.js      # Cache manager
   ├── collectors/
   │   ├── discord.js    # Discord collector
   │   ├── spotify.js    # Spotify collector
   │   ├── leetcode.js   # LeetCode collector
   │   └── wakatime.js   # WakaTime collector
   └── routes/
       └── stats.js      # API routes
   ```

## 📋 Configuration

Everything about configuration:

1. **[.env.example](.env.example)** - Environment template

   - All available variables
   - Where to get API keys
   - Direct links to sign-up pages
   - Default values
   - Configuration options

2. **Required Services**:
   - [Upstash Redis](https://console.upstash.com/) - Cache database
   - [Lanyard Discord](https://discord.gg/lanyard) - Discord presence
   - [WakaTime](https://wakatime.com/settings/api-key) - Coding stats
   - LeetCode - No key needed (public API)

## 🚢 Deployment

Deployment-specific documentation:

1. **[render.yaml](render.yaml)** - Render configuration

   - Service configuration
   - Build/start commands
   - Environment variables
   - Health check path

2. **Deployment Guides** (in README.md):
   - Step-by-step Render deployment
   - Environment variable setup
   - Post-deployment verification
   - Troubleshooting

## 🧪 Testing

Testing and verification:

1. **[test.sh](test.sh)** - Health check script

   - Server status check
   - Endpoint testing
   - Response time measurement
   - Configuration verification
   - Usage: `./test.sh`

2. **Manual Testing**:

   ```bash
   # Start server
   npm run dev

   # Test endpoints
   curl http://localhost:3000/health
   curl http://localhost:3000/stats

   # Run automated tests
   ./test.sh
   ```

## 📝 Change Management

Tracking changes and updates:

1. **[CHANGELOG.md](CHANGELOG.md)** - Version history
   - Release notes
   - Feature additions
   - Bug fixes
   - Breaking changes
   - Migration guides

## 🎯 Common Use Cases

### For New Users

1. Read [README.md](README.md) - Understand what the project does
2. Run [setup.sh](setup.sh) - Quick automated setup
3. Follow Quick Start in README - Get running locally
4. Check [API_DOCS.md](API_DOCS.md) - Learn the API
5. Deploy to Render - Go live

### For Developers Adding Features

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) - Learn the structure
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) - Understand the system
3. Check existing collectors - See examples
4. Implement new collector - Follow the guide
5. Update documentation - Keep docs current

### For Integration

1. Check [API_DOCS.md](API_DOCS.md) - API reference
2. Review [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick examples
3. Look at client examples - Copy patterns
4. Test with [test.sh](test.sh) - Verify functionality
5. Monitor `/health` endpoint - Check status

### For Troubleshooting

1. Run [test.sh](test.sh) - Automated diagnostics
2. Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Common issues
3. Review logs - Server or Render dashboard
4. Check [API_DOCS.md](API_DOCS.md) - Error responses
5. Open GitHub issue - Get help

## 🔍 Quick Links by Topic

### Setup & Installation

- [README.md](README.md) - Main setup guide
- [.env.example](.env.example) - Configuration template
- [setup.sh](setup.sh) - Automated setup

### API Usage

- [API_DOCS.md](API_DOCS.md) - Complete API docs
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick reference

### Development

- [CONTRIBUTING.md](CONTRIBUTING.md) - Developer guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design

### Deployment

- [render.yaml](render.yaml) - Deployment config
- [README.md#deployment](README.md) - Deployment guide

### Testing

- [test.sh](test.sh) - Test script
- [QUICK_REFERENCE.md#troubleshooting](QUICK_REFERENCE.md) - Troubleshooting

### Maintenance

- [CHANGELOG.md](CHANGELOG.md) - Version history
- [QUICK_REFERENCE.md#monitoring](QUICK_REFERENCE.md) - Monitoring

## 📚 Learning Path

### Beginner (Just want to use it)

1. README.md → Quick Start
2. setup.sh → Run setup
3. API_DOCS.md → Learn endpoints
4. Deploy to Render

### Intermediate (Want to understand it)

1. PROJECT_SUMMARY.md → Overview
2. ARCHITECTURE.md → How it works
3. Source code → Read implementations
4. QUICK_REFERENCE.md → Advanced usage

### Advanced (Want to extend it)

1. CONTRIBUTING.md → Extension guide
2. ARCHITECTURE.md → Deep dive
3. Existing collectors → Study examples
4. Build new collector → Add features

## 🎓 External Resources

### APIs Used

- [Lanyard API Docs](https://github.com/Phineas/lanyard) - Discord presence
- [LeetCode API](https://leetcode.com/graphql) - GraphQL endpoint
- [WakaTime API Docs](https://wakatime.com/developers) - REST API

### Tools & Services

- [Upstash Documentation](https://docs.upstash.com/) - Redis hosting
- [Render Documentation](https://render.com/docs) - Deployment platform
- [Express.js Guide](https://expressjs.com/) - Web framework
- [node-cron Docs](https://github.com/node-cron/node-cron) - Scheduling

### Learning Resources

- [REST API Design](https://restfulapi.net/) - API best practices
- [Redis Guide](https://redis.io/documentation) - Caching strategies
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) - Cross-origin requests

## 🤔 FAQ

**Q: Where do I start?**  
A: Read [README.md](README.md) and run [setup.sh](setup.sh)

**Q: How do I add a new data source?**  
A: Follow the guide in [CONTRIBUTING.md](CONTRIBUTING.md)

**Q: What are all the API endpoints?**  
A: Check [API_DOCS.md](API_DOCS.md)

**Q: How do I deploy this?**  
A: See the deployment section in [README.md](README.md)

**Q: Something's not working, what do I do?**  
A: Run [test.sh](test.sh) and check [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

**Q: How does the architecture work?**  
A: Read [ARCHITECTURE.md](ARCHITECTURE.md)

**Q: Can I use this for my own project?**  
A: Yes! It's MIT licensed. Fork and customize.

## 📞 Support

- **Questions**: Open a GitHub discussion
- **Bugs**: Open a GitHub issue
- **Features**: Open a GitHub issue with enhancement label
- **Security**: Email privately or open issue

## 🔄 Documentation Updates

This documentation is continuously updated. Check [CHANGELOG.md](CHANGELOG.md) for recent changes.

Last updated: 2026-01-01

---

**Need help finding something?** Open an issue and we'll improve the documentation!
