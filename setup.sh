#!/bin/bash

# Personal Stats API - Quick Setup Script
# This script helps you set up the API quickly

set -e

echo "================================"
echo "Personal Stats API - Quick Setup"
echo "================================"
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled. Edit .env manually."
        exit 0
    fi
fi

# Copy .env.example to .env
cp .env.example .env
echo "✅ Created .env file"
echo ""

# Prompt for required values
echo "Please provide the following required credentials:"
echo "(Press Enter to skip and configure manually later)"
echo ""

# Upstash Redis REST URL
read -p "Upstash Redis REST URL (from https://console.upstash.com/): " redis_url
if [ ! -z "$redis_url" ]; then
    sed -i "s|UPSTASH_REDIS_REST_URL=.*|UPSTASH_REDIS_REST_URL=$redis_url|g" .env
    echo "✅ Upstash Redis URL configured"
else
    echo "⚠️  Skipped - configure UPSTASH_REDIS_REST_URL in .env manually"
fi
echo ""

# Upstash Redis REST Token
read -p "Upstash Redis REST Token: " redis_token
if [ ! -z "$redis_token" ]; then
    sed -i "s|UPSTASH_REDIS_REST_TOKEN=.*|UPSTASH_REDIS_REST_TOKEN=$redis_token|g" .env
    echo "✅ Upstash Redis Token configured"
else
    echo "⚠️  Skipped - configure UPSTASH_REDIS_REST_TOKEN in .env manually"
fi
echo ""

# Discord User ID
read -p "Discord User ID (from Discord Developer Mode): " discord_id
if [ ! -z "$discord_id" ]; then
    sed -i "s|DISCORD_USER_ID=.*|DISCORD_USER_ID=$discord_id|g" .env
    echo "✅ Discord User ID configured"
else
    echo "⚠️  Skipped - configure DISCORD_USER_ID in .env manually"
fi
echo ""

# Spotify credentials
echo "Spotify API Setup (https://developer.spotify.com/dashboard)"
read -p "Spotify Client ID: " spotify_id
if [ ! -z "$spotify_id" ]; then
    sed -i "s|SPOTIFY_CLIENT_ID=.*|SPOTIFY_CLIENT_ID=$spotify_id|g" .env
    echo "✅ Spotify Client ID configured"
else
    echo "⚠️  Skipped - configure SPOTIFY_CLIENT_ID in .env manually"
fi
echo ""

read -p "Spotify Client Secret: " spotify_secret
if [ ! -z "$spotify_secret" ]; then
    sed -i "s|SPOTIFY_CLIENT_SECRET=.*|SPOTIFY_CLIENT_SECRET=$spotify_secret|g" .env
    echo "✅ Spotify Client Secret configured"
else
    echo "⚠️  Skipped - configure SPOTIFY_CLIENT_SECRET in .env manually"
fi
echo ""

read -p "Spotify Refresh Token (run setup-spotify.js if you don't have it): " spotify_token
if [ ! -z "$spotify_token" ]; then
    sed -i "s|SPOTIFY_REFRESH_TOKEN=.*|SPOTIFY_REFRESH_TOKEN=$spotify_token|g" .env
    echo "✅ Spotify Refresh Token configured"
else
    echo "⚠️  Skipped - run 'node setup-spotify.js' to get refresh token"
fi
echo ""

# LeetCode Username
read -p "LeetCode Username: " leetcode_user
if [ ! -z "$leetcode_user" ]; then
    sed -i "s|LEETCODE_USERNAME=.*|LEETCODE_USERNAME=$leetcode_user|g" .env
    echo "✅ LeetCode username configured"
else
    echo "⚠️  Skipped - configure LEETCODE_USERNAME in .env manually"
fi
echo ""

# WakaTime API Key
read -p "WakaTime API Key (from https://wakatime.com/settings/api-key): " wakatime_key
if [ ! -z "$wakatime_key" ]; then
    sed -i "s|WAKATIME_API_KEY=.*|WAKATIME_API_KEY=$wakatime_key|g" .env
    echo "✅ WakaTime API key configured"
else
    echo "⚠️  Skipped - configure WAKATIME_API_KEY in .env manually"
fi
echo ""

# Install dependencies
echo "================================"
echo "Installing dependencies..."
echo "================================"
npm install

echo ""
echo "================================"
echo "✅ Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Review and edit .env file if needed"
echo "2. For Spotify: Run 'node setup-spotify.js' if you skipped refresh token"
echo "3. Make sure you've joined the Lanyard Discord server: https://discord.gg/lanyard"
echo "4. Run 'npm run dev' to start the development server"
echo "5. Visit http://localhost:3000 to see your API"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Setup and deployment guide"
echo "   - API_DOCS.md - API endpoint documentation"
echo "   - QUICK_REFERENCE.md - Quick reference card"
echo ""
echo "Happy coding! 🚀"
