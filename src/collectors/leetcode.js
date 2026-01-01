const axios = require("axios");
const { setCache, getCache } = require("../cache/redis");

const LEETCODE_GRAPHQL_ENDPOINT = "https://leetcode.com/graphql";
const CACHE_KEY = "stats:leetcode";
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 300;

/**
 * Fetch LeetCode user statistics
 * Uses the public GraphQL API
 */
async function fetchLeetCodeData() {
	try {
		const username = process.env.LEETCODE_USERNAME;

		if (!username) {
			console.warn("⚠️  LEETCODE_USERNAME not configured");
			return null;
		}

		console.log("🔄 Fetching LeetCode data...");

		// Query 1: User profile and problem stats
		const userProfileQuery = {
			query: `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
            profile {
              realName
              aboutMe
              userAvatar
              location
              skillTags
              websites
              countryName
              company
              school
              starRating
              ranking
            }
            submitStats {
              acSubmissionNum {
                difficulty
                count
                submissions
              }
            }
          }
          allQuestionsCount {
            difficulty
            count
          }
        }
      `,
			variables: { username },
		};

		// Query 2: Recent submissions and contest stats
		const contestStatsQuery = {
			query: `
        query getUserContestInfo($username: String!) {
          userContestRanking(username: $username) {
            attendedContestsCount
            rating
            globalRanking
            topPercentage
          }
          userContestRankingHistory(username: $username) {
            attended
            rating
            ranking
            trendDirection
            problemsSolved
            totalProblems
            finishTimeInSeconds
            contest {
              title
              startTime
            }
          }
        }
      `,
			variables: { username },
		};

		// Fetch both queries
		const [profileResponse, contestResponse] = await Promise.all([
			axios.post(LEETCODE_GRAPHQL_ENDPOINT, userProfileQuery, {
				timeout: 15000,
				headers: {
					"Content-Type": "application/json",
					"User-Agent": "Personal-Stats-API/1.0",
				},
			}),
			axios
				.post(LEETCODE_GRAPHQL_ENDPOINT, contestStatsQuery, {
					timeout: 15000,
					headers: {
						"Content-Type": "application/json",
						"User-Agent": "Personal-Stats-API/1.0",
					},
				})
				.catch(() => ({ data: { data: null } })), // Contest stats might fail for some users
		]);

		const profileData = profileResponse.data.data;
		const contestData = contestResponse.data.data;

		if (!profileData || !profileData.matchedUser) {
			throw new Error("User not found or invalid response from LeetCode");
		}

		// Parse submission stats
		const submitStats = profileData.matchedUser.submitStats.acSubmissionNum;
		const problemsSolved = {
			all: submitStats.find((s) => s.difficulty === "All")?.count || 0,
			easy: submitStats.find((s) => s.difficulty === "Easy")?.count || 0,
			medium: submitStats.find((s) => s.difficulty === "Medium")?.count || 0,
			hard: submitStats.find((s) => s.difficulty === "Hard")?.count || 0,
		};

		const totalSubmissions = {
			all: submitStats.find((s) => s.difficulty === "All")?.submissions || 0,
			easy: submitStats.find((s) => s.difficulty === "Easy")?.submissions || 0,
			medium:
				submitStats.find((s) => s.difficulty === "Medium")?.submissions || 0,
			hard: submitStats.find((s) => s.difficulty === "Hard")?.submissions || 0,
		};

		// Parse total problems
		const allQuestions = profileData.allQuestionsCount;
		const totalProblems = {
			all: allQuestions.find((q) => q.difficulty === "All")?.count || 0,
			easy: allQuestions.find((q) => q.difficulty === "Easy")?.count || 0,
			medium: allQuestions.find((q) => q.difficulty === "Medium")?.count || 0,
			hard: allQuestions.find((q) => q.difficulty === "Hard")?.count || 0,
		};

		// Calculate progress percentages
		const progress = {
			easy: totalProblems.easy
				? ((problemsSolved.easy / totalProblems.easy) * 100).toFixed(2)
				: 0,
			medium: totalProblems.medium
				? ((problemsSolved.medium / totalProblems.medium) * 100).toFixed(2)
				: 0,
			hard: totalProblems.hard
				? ((problemsSolved.hard / totalProblems.hard) * 100).toFixed(2)
				: 0,
			all: totalProblems.all
				? ((problemsSolved.all / totalProblems.all) * 100).toFixed(2)
				: 0,
		};

		// Normalize the data
		const normalized = {
			username: profileData.matchedUser.username,
			profile: {
				real_name: profileData.matchedUser.profile.realName,
				avatar: profileData.matchedUser.profile.userAvatar,
				location: profileData.matchedUser.profile.location,
				country: profileData.matchedUser.profile.countryName,
				company: profileData.matchedUser.profile.company,
				school: profileData.matchedUser.profile.school,
				websites: profileData.matchedUser.profile.websites || [],
				skill_tags: profileData.matchedUser.profile.skillTags || [],
				about: profileData.matchedUser.profile.aboutMe,
				star_rating: profileData.matchedUser.profile.starRating,
				ranking: profileData.matchedUser.profile.ranking,
			},
			problems_solved: problemsSolved,
			total_submissions: totalSubmissions,
			total_problems: totalProblems,
			progress_percentage: progress,
			acceptance_rate: totalSubmissions.all
				? ((problemsSolved.all / totalSubmissions.all) * 100).toFixed(2)
				: 0,
			contest_stats:
				contestData && contestData.userContestRanking
					? {
							attended: contestData.userContestRanking.attendedContestsCount,
							rating: Math.round(contestData.userContestRanking.rating),
							global_ranking: contestData.userContestRanking.globalRanking,
							top_percentage:
								contestData.userContestRanking.topPercentage.toFixed(2),
							history:
								contestData.userContestRankingHistory?.slice(0, 10) || [], // Last 10 contests
					  }
					: null,
			last_updated: new Date().toISOString(),
		};

		// Cache the data
		await setCache(CACHE_KEY, normalized, CACHE_TTL);

		console.log("✅ LeetCode data updated");
		return normalized;
	} catch (error) {
		console.error("❌ Error fetching LeetCode data:", error.message);

		// Return cached data if available
		const cached = await getCache(CACHE_KEY);
		if (cached) {
			console.log("📦 Returning cached LeetCode data");
			return cached;
		}

		return null;
	}
}

/**
 * Get LeetCode data (from cache or fetch if needed)
 */
async function getLeetCodeData() {
	const cached = await getCache(CACHE_KEY);

	if (cached) {
		return cached;
	}

	return await fetchLeetCodeData();
}

module.exports = {
	fetchLeetCodeData,
	getLeetCodeData,
	CACHE_KEY,
};
