// backend/controllers/dashboardController.js

const User = require('../models/User');
const Problem = require('../models/Problem');

exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;

        // Ensure 'recentSubmissions' is selected if you store it directly on the User model
        const user = await User.findById(userId).select(
            'username avatarUrl rank rating maxRating problemsSolved problemsSolvedChange submissions acceptanceRate communityStats languages dailySubmissions monthlyPerformance skillTreeProgress streaks algorithmicPerformance communityContributions historicalMetrics languageProficiency achievementTimeline personalizedRecommendations recentSubmissions'
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // --- Hardcoded Problem IDs for Personalized Recommendations (as requested) ---
        const hardcodedRecommendedProblems = [
            { id: '6873f63dbfdbb7d8a6b1e82d', title: 'Sum of Two Numbers', difficulty: 'Easy', reason: 'A great start for new concepts.' },
            { id: '6878ed70a1fb8ad233131d19', title: 'Nth Fibonacci Number', difficulty: 'Medium', reason: 'Practice with recursion or dynamic programming.' },
            { id: '6878ed41a1fb8ad233131d08', title: 'Is Prime?', difficulty: 'Hard', reason: 'Challenge your number theory skills.' },
            { id: '6878edb9a1fb8ad233131d21', title: 'Reverse a String', difficulty: 'Easy', reason: 'Fundamental string manipulation.' },
            { id: '6878ee02a1fb8ad233131d30', title: 'Palindrome Check', difficulty: 'Medium', reason: 'Good for two-pointer technique practice.' },
        ];

        // =========================================================================
        // >>>>> CORRECTED LOGIC FOR recentSubmissions <<<<<
        // If user.recentSubmissions exists and has data, use it.
        // Otherwise, send an empty array.
        // The mockRecentSubmissions array is removed, as it was causing the issue.
        // =========================================================================
        const recentSubmissionsToSend = (user.recentSubmissions && user.recentSubmissions.length > 0)
            ? user.recentSubmissions
            : [];
        // =========================================================================


        // --- Shape the data for the frontend dashboard ---
        const dashboardData = {
            profile: {
                username: user.username,
                handle: user.username,
                rank: user.rank,
                avatar: user.avatarUrl || '/profile-placeholder.svg',
                rating: user.rating || 0,
                maxRating: user.maxRating || 0,
            },
            stats: {
                totalSolved: user.problemsSolved?.total || 0,
                easySolved: user.problemsSolved?.easy || 0,
                mediumSolved: user.problemsSolved?.medium || 0,
                hardSolved: user.problemsSolved?.hard || 0,
                totalProblems: 3611, // Static for now, could be dynamic
                totalSubmissions: user.submissions?.total || 0,
                acceptedSubmissions: user.submissions?.accepted || 0,
                rejectedSubmissions: user.submissions?.rejected || 0,
                acceptanceRate: user.acceptanceRate || 0,
                problemsSolvedChange: user.problemsSolvedChange || 0,
            },
            community: {
                views: user.communityStats?.views || 0,
                solutions: user.communityStats?.solutions || 0,
                discuss: user.communityStats?.discuss || 0,
                reputation: user.communityStats?.reputation || 0,
            },
            languages: user.languages || [],
            heatmap: {
                dailySubmissions: user.dailySubmissions || [],
                totalActiveDays: user.dailySubmissions ? user.dailySubmissions.filter(d => d.count > 0).length : 0,
                maxStreak: user.streaks ? user.streaks.dailySolveStreak : 0,
            },
            performanceTrend: user.monthlyPerformance || [],
            skillTreeProgress: user.skillTreeProgress || {},
            streaks: user.streaks || {},
            algorithmicPerformance: user.algorithmicPerformance || {},
            communityHelpStatus: user.communityContributions || {},
            historicalMetrics: user.historicalMetrics || {},
            languageProficiency: user.languageProficiency || {},
            achievementTimeline: user.achievementTimeline || [],
            personalizedRecommendations: user.personalizedRecommendations && user.personalizedRecommendations.length > 0
                ? user.personalizedRecommendations
                : hardcodedRecommendedProblems,
            recentSubmissions: recentSubmissionsToSend, // Now uses the conditionally determined array
        };

        console.log("Backend sending dashboard data:", dashboardData);
        res.status(200).json(dashboardData);

    } catch (error) {
        console.error('Error fetching dashboard data for user:', req.user ? req.user.id : 'N/A', error);
        res.status(500).json({ message: 'Server error: Could not retrieve dashboard data.' });
    }
};
