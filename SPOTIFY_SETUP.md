# Spotify API Setup Guide

This project now uses the **official Spotify API** to track currently playing music, which is more reliable than Discord/Lanyard integration.

## Prerequisites

- A Spotify account (free or premium)
- Node.js installed

## Setup Steps

### 1. Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **"Create App"**
4. Fill in:
   - **App Name**: `Personal Stats API` (or any name)
   - **App Description**: `Personal stats tracker`
   - **Redirect URI**: `http://localhost:8888/callback`
5. Check the boxes to agree to terms
6. Click **"Save"**
7. Copy your **Client ID** and **Client Secret**

### 2. Get Your Refresh Token

Run the setup script:

```bash
SPOTIFY_CLIENT_ID=your_client_id \
SPOTIFY_CLIENT_SECRET=your_client_secret \
node setup-spotify.js
```

This will:

1. Start a local server on port 8888
2. Print an authorization URL
3. Open the URL in your browser (or copy/paste it)
4. After you authorize, it will display your refresh token

### 3. Update .env File

Add these lines to your `.env` file:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REFRESH_TOKEN=your_refresh_token_here
```

### 4. Test It

Start the server:

```bash
npm run dev
```

Play a song on Spotify and check the API:

```bash
curl http://localhost:3000/stats/spotify | jq
```

## Required Scopes

The app needs these Spotify permissions:

- `user-read-currently-playing` - See what you're currently playing
- `user-read-playback-state` - See playback state (playing/paused)

## Troubleshooting

### "401 Unauthorized" Error

- Make sure your Client ID and Secret are correct
- Verify the refresh token is properly set in `.env`
- Try regenerating the refresh token

### No Currently Playing Data

- Make sure you're actually playing music on Spotify
- The API returns 204 (no content) when nothing is playing
- Check that your Spotify account has playback activity

### Redirect URI Mismatch

- Make sure `http://localhost:8888/callback` is added in your Spotify app settings
- It must match exactly (including the port)

## API Response Example

When playing:

```json
{
	"is_playing": true,
	"current_track": {
		"name": "Song Name",
		"artists": [{ "name": "Artist Name" }],
		"album": {
			"name": "Album Name",
			"album_art_url": "https://..."
		},
		"duration_ms": 180000,
		"progress_ms": 45000
	}
}
```

When not playing:

```json
{
	"is_playing": false,
	"current_track": null,
	"last_updated": "2026-01-02T..."
}
```

## Notes

- Access tokens expire after 1 hour but are automatically refreshed
- Refresh tokens don't expire unless revoked
- The API checks Spotify every 2 minutes by default (configurable via `INTERVAL_SPOTIFY`)
- Data is cached in Redis for 5 minutes (configurable via `CACHE_TTL`)
