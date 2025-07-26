// backend/models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // Existing fields - DO NOT DISTURB
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    },

    // === NEW DASHBOARD-RELATED FIELDS ===
    avatarUrl: {
        type: String,
        default: '/profile-placeholder.svg'
    },
    rank: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 1200
    },
    maxRating: {
        type: Number,
        default: 1200
    },
    problemsSolvedChange: {
        type: Number,
        default: 0
    },
    problemsSolved: {
        total: { type: Number, default: 0 },
        easy: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        hard: { type: Number, default: 0 }
    },
    submissions: {
        total: { type: Number, default: 0 },
        accepted: { type: Number, default: 0 },
        rejected: { type: Number, default: 0 }
    },
    acceptanceRate: {
        type: Number,
        default: 0.0
    },
    communityStats: {
        views: { type: Number, default: 0 },
        solutions: { type: Number, default: 0 },
        discuss: { type: Number, default: 0 },
        reputation: { type: Number, default: 0 }
    },
    languages: [{
        name: { type: String, required: true },
        problemsSolved: { type: Number, default: 0 }
    }],
    dailySubmissions: [{
        date: { type: Date, required: true },
        count: { type: Number, default: 0 }
    }],
    monthlyPerformance: [{
        monthYear: { type: String, required: true },
        rating: { type: Number, default: 0 },
    }],

    skillTreeProgress: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    streaks: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            hardProblemStreak: 0,
            optimalSolutionStreak: 0,
            dailySolveStreak: 0
        }
    },
    algorithmicPerformance: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    communityContributions: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            helpRequests: 0,
            answersGiven: 0
        }
    },
    historicalMetrics: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    languageProficiency: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    achievementTimeline: [{
        date: { type: Date, default: Date.now },
        description: { type: String, required: true },
        icon: String
    }],

    personalizedRecommendations: [
        {
            id: { type: String, required: true },
            title: { type: String, required: true },
            difficulty: { type: String, required: true, enum: ['Easy', 'Medium', 'Hard'] },
            reason: { type: String }
        }
    ],
    // =========================================================================
    // >>>>> ADDED THE recentSubmissions FIELD HERE <<<<<
    // This will store a limited history of recent submissions directly on the user.
    // Each entry should match the RecentSubmission interface on the frontend.
    // =========================================================================
    recentSubmissions: [{
        id: { type: String, required: true }, // Unique ID for the submission entry (can be auto-generated or problemId + timestamp)
        problem: { type: String, required: true }, // Problem title
        verdict: { type: String, required: true }, // e.g., "Accepted", "Wrong Answer"
        language: { type: String, required: true }, // e.g., "C++", "Python"
        time: { type: String, required: true }, // e.g., "5 minutes ago" (or store Date and format on frontend)
        // You might want to add a problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem' } here
        // if you want to link to the actual problem document.
    }],
    // =========================================================================

}, { timestamps: false });

userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('User', userSchema);
