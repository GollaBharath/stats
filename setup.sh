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

# Redis URL
read -p "Upstash Redis URL (from https://console.upstash.com/): " redis_url
if [ ! -z "$redis_url" ]; then
    sed -i "s|REDIS_URL=.*|REDIS_URL=$redis_url|g" .env
    echo "✅ Redis URL configured"
else
    echo "⚠️  Skipped - configure REDIS_URL in .env manually"
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
echo "2. Make sure you've joined the Lanyard Discord server: https://discord.gg/lanyard"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Visit http://localhost:3000 to see your API"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Setup and deployment guide"
echo "   - API_DOCS.md - API endpoint documentation"
echo "   - CONTRIBUTING.md - Guide for adding new data sources"
echo ""
echo "Happy coding! 🚀"
