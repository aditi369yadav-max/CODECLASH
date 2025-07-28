// src/types/dashboard.ts (or wherever you prefer to store your types)

// --- Nested Interfaces (matching the backend's shaping) ---

interface UserProfile {
  username: string;
  handle: string; // From user.username
  rank: number;
  avatar: string; // From user.avatarUrl or default
  rating: number;
  maxRating: number;
}

interface UserStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalProblems: number; // Static in backend, can be made dynamic
  totalSubmissions: number;
  acceptedSubmissions: number;
  rejectedSubmissions: number;
  acceptanceRate: number;
  problemsSolvedChange: number;
}

interface CommunityActivity { // Renamed from CommunityStats to avoid clash with model field
  views: number;
  solutions: number;
  discuss: number;
  reputation: number;
}

interface LanguageProgress {
  name: string;
  problemsSolved: number;
}

interface HeatmapData {
  dailySubmissions: Array<{
    date: string; // Date object in backend, but will be string on frontend after JSON.parse
    count: number;
  }>;
  totalActiveDays: number;
  maxStreak: number; // This is dailySolveStreak from backend
}

interface MonthlyPerformanceEntry {
  monthYear: string;
  rating: number;
}

interface SkillTreeProgress {
  // This is Mixed in backend, defaulting to {},
  // Define based on how you actually populate/use this data.
  // Assuming it's an object with string keys and number values based on general usage:
  [key: string]: number; // Example: { "frontend": 80, "backend": 75, ... }
  // If specific fields are guaranteed, list them:
  // e.g., frontend?: number;
}

interface StreaksData { // Renamed from Streaks to avoid clash with model field name
  hardProblemStreak: number;
  optimalSolutionStreak: number;
  dailySolveStreak: number;
}

interface AlgorithmicPerformance {
  // This is Mixed in backend, defaulting to {},
  // Define based on how you actually populate/use this data.
  [key: string]: number | string; // Example: { "avgTime": 120, "languagePreference": "Python" }
  // Try to be more specific if possible (e.g., if it only contains numbers, use 'number' only)
}

interface CommunityHelpStatus { // Renamed from CommunityContributions for clarity in frontend
  helpRequests: number;
  answersGiven: number;
}

interface HistoricalMetrics {
  // Corrected: Providing a more specific type based on the 'timeline' example
  timeline?: Array<{ date: string; value: number }>;
  // Add any other specific properties if you know them.
  // If the backend truly sends arbitrary, unknown keys,
  // and you absolutely cannot define them, then `[key: string]: unknown;`
  // is a slightly better alternative than `any` as it still forces checks when accessing.
  // However, `timeline` seems to be the main expected structure here.
}

interface LanguageProficiency {
  // This is Mixed in backend, defaulting to {},
  // Define based on how you actually populate/use this data.
  [key: string]: number; // Example: { "JavaScript": 90, "Python": 85 }
}

interface AchievementTimelineEntry {
  date: string; // Date converted to string by JSON.parse
  description: string;
  icon?: string; // Optional field
}

interface PersonalizedRecommendation {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  reason?: string;
}

interface RecentSubmission {
  id: string;
  problem: string;
  verdict: string;
  language: string;
  time: string;
}


// --- Main Dashboard Data Interface ---
export interface DashboardBackendData {
  profile: UserProfile;
  stats: UserStats;
  community: CommunityActivity;
  languages: LanguageProgress[];
  heatmap: HeatmapData;
  performanceTrend: MonthlyPerformanceEntry[];
  skillTreeProgress: SkillTreeProgress;
  streaks: StreaksData;
  algorithmicPerformance: AlgorithmicPerformance;
  communityHelpStatus: CommunityHelpStatus;
  historicalMetrics: HistoricalMetrics;
  languageProficiency: LanguageProficiency;
  achievementTimeline: AchievementTimelineEntry[];
  personalizedRecommendations: PersonalizedRecommendation[];
  recentSubmissions: RecentSubmission[];
}