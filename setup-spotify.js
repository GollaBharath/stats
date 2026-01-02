#!/usr/bin/env node

/**
 * Spotify OAuth Setup Script
 *
 * This script helps you get a Spotify refresh token for the API.
 *
 * Steps:
 * 1. Create a Spotify app at https://developer.spotify.com/dashboard
 * 2. Add redirect URI: http://127.0.0.1:8888/callback
 * 3. Run: SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=xxx node setup-spotify.js
 * 4. Visit the URL shown, authorize, and copy the refresh token to .env
 */

const http = require("http");
const url = require("url");
const querystring = require("querystring");

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = "http://127.0.0.1:8888/callback";
const SCOPES = "user-read-currently-playing user-read-playback-state";

if (!CLIENT_ID || !CLIENT_SECRET) {
	console.error(
		"❌ Error: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables are required\n"
	);
	console.log("Usage:");
	console.log(
		"  SPOTIFY_CLIENT_ID=your_id SPOTIFY_CLIENT_SECRET=your_secret node setup-spotify.js\n"
	);
	console.log(
		"Get your credentials from: https://developer.spotify.com/dashboard"
	);
	process.exit(1);
}

const server = http.createServer(async (req, res) => {
	const parsedUrl = url.parse(req.url);

	if (parsedUrl.pathname === "/callback") {
		const query = querystring.parse(parsedUrl.query);

		if (query.error) {
			res.writeHead(400, { "Content-Type": "text/html" });
			res.end(`<h1>Authorization Failed</h1><p>Error: ${query.error}</p>`);
			return;
		}

		const code = query.code;

		try {
			// Exchange code for tokens
			const axios = require("axios");
			const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
				"base64"
			);

			const response = await axios.post(
				"https://accounts.spotify.com/api/token",
				querystring.stringify({
					grant_type: "authorization_code",
					code: code,
					redirect_uri: REDIRECT_URI,
				}),
				{
					headers: {
						Authorization: `Basic ${credentials}`,
						"Content-Type": "application/x-www-form-urlencoded",
					},
				}
			);

			const refreshToken = response.data.refresh_token;

			res.writeHead(200, { "Content-Type": "text/html" });
			res.end(`
                <h1>✅ Success!</h1>
                <p>Add this to your .env file:</p>
                <pre style="background: #f0f0f0; padding: 15px; border-radius: 5px;">SPOTIFY_REFRESH_TOKEN=${refreshToken}</pre>
                <p>You can close this window now.</p>
            `);

			console.log("\n✅ Success! Add this to your .env file:\n");
			console.log(`SPOTIFY_REFRESH_TOKEN=${refreshToken}\n`);

			setTimeout(() => {
				server.close();
				process.exit(0);
			}, 1000);
		} catch (error) {
			console.error("❌ Error exchanging code for token:", error.message);
			res.writeHead(500, { "Content-Type": "text/html" });
			res.end(`<h1>Error</h1><p>${error.message}</p>`);
		}
	} else {
		res.writeHead(404);
		res.end("Not found");
	}
});

server.listen(8888, () => {
	const authUrl =
		"https://accounts.spotify.com/authorize?" +
		querystring.stringify({
			response_type: "code",
			client_id: CLIENT_ID,
			scope: SCOPES,
			redirect_uri: REDIRECT_URI,
		});

	console.log("🎵 Spotify OAuth Setup\n");
	console.log("📝 Steps:");
	console.log("   1. Click the URL below to authorize");
	console.log("   2. Log in to Spotify and approve");
	console.log("   3. Copy the refresh token to your .env file\n");
	console.log("🔗 Authorization URL:\n");
	console.log(authUrl + "\n");
	console.log("⏳ Waiting for authorization...");
});
