// client/app/dashboard/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend as RechartsLegend // Renamed to avoid conflict
} from 'recharts';

// Import shared styles
import homeStyles from '../home.module.css'; // For Navbar and Footer
import styles from './dashboard.module.css'; // For Dashboard specific styles

// --- Interfaces for Backend Data (Matching dashboardController.js output) ---
interface ProfileData {
  username: string;
  handle: string; // Assuming 'handle' is also sent
  rank: number;
  avatar: string;
  rating: number; // Added based on backend controller
  maxRating: number; // Added based on backend controller
}

interface StatsData {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalProblems: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  rejectedSubmissions: number;
  acceptanceRate: number;
  problemsSolvedChange?: number; // <--- ADDED THIS FIELD (OPTIONAL)
}

interface CommunityData {
  views: number;
  solutions: number;
  discuss: number;
  reputation: number;
}

interface LanguageData {
  name: string;
  solved: number;
}

interface HeatmapData {
  dailySubmissions: { date: string; count: number; }[];
  totalActiveDays: number;
  maxStreak: number;
}

interface PerformanceTrendEntry {
  name: string; // e.g., "Jan 2025"
  rating: number; // Assuming monthlyPerformance maps to rating history
}

interface SkillTreeProgress {
  // Define structure based on your User model
  [key: string]: any; // Placeholder, define properly if used
}

interface Streaks {
  dailySolveStreak: number;
  // Other streak types if any
  [key: string]: any; // Placeholder
}

interface AlgorithmicPerformance {
  // Define structure based on your User model
  [key: string]: any; // Placeholder
}

interface CommunityContributions {
  // Define structure based on your User model
  [key: string]: any; // Placeholder
}

interface HistoricalMetrics {
  // Define structure based on your User model
  [key: string]: any; // Placeholder
}

interface LanguageProficiency {
  // Define structure based on your User model
  [key: string]: any; // Placeholder
}

interface AchievementTimelineEntry {
  // Define structure based on your User model
  [key: string]: any; // Placeholder
}

interface PersonalizedRecommendation {
  id: string;
  title: string;
  difficulty: string;
  reason?: string; // Optional, as your mock data has it, but backend might not
}

interface RecentSubmission { // <--- NEW INTERFACE FOR RECENT SUBMISSIONS
  id: string;
  problem: string;
  verdict: string;
  language: string;
  time: string;
}

// Main Dashboard Data Interface (matches backend's dashboardData object)
interface DashboardBackendData {
  profile: ProfileData;
  stats: StatsData;
  community: CommunityData;
  languages: LanguageData[];
  heatmap: HeatmapData;
  performanceTrend: PerformanceTrendEntry[];
  skillTreeProgress: SkillTreeProgress;
  streaks: Streaks;
  algorithmicPerformance: AlgorithmicPerformance;
  communityHelpStatus: CommunityContributions;
  historicalMetrics: HistoricalMetrics;
  languageProficiency: LanguageProficiency;
  achievementTimeline: AchievementTimelineEntry[];
  personalizedRecommendations: PersonalizedRecommendation[];
  recentSubmissions: RecentSubmission[]; // <--- ADDED THIS FIELD
}

// Client-side processed Heatmap Day interface
interface ClientHeatmapDay {
  date: string;
  dayOfWeek: number;
  month: number;
  level: number;
  count: number;
}

export default function DashboardPage() {
  const [isDarkTheme, setIsDarkTheme] = useState(true); // Local theme state
  // Removed authToken state, as it's handled by httpOnly cookies

  // --- Consolidated Data State ---
  const [dashboardData, setDashboardData] = useState<DashboardBackendData | null>(null);

  // --- Loading & Error States (Consolidated) ---
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); // To track login status based on API response

  // --- Client-side processed Heatmap Data ---
  const [heatmapWeeks, setHeatmapWeeks] = useState<(ClientHeatmapDay | null)[][]>([]);
  const [heatmapMonthLabels, setHeatmapMonthLabels] = useState<{ month: string; col: number }[]>([]);

  // Removed useEffect for authToken retrieval, now relying on API response for login status

  // --- Heatmap Data Generation Function (moved inside component for clarity, processes raw data) ---
  const generateHeatmapData = useCallback((data: { date: string; count: number; }[], numDays: number = 365) => {
    const processedData: ClientHeatmapDay[] = [];
    const today = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Create a map for quick lookup of counts by date
    const dateMap = new Map<string, number>();
    data.forEach(d => dateMap.set(d.date, d.count));

    for (let i = 0; i < numDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (numDays - 1 - i)); // Go back in time
      const dateString = date.toISOString().split('T')[0];

      const dayOfWeek = date.getDay(); // 0 for Sunday, 6 for Saturday
      const month = date.getMonth();
      const count = dateMap.get(dateString) || 0; // Get count from fetched data, default to 0

      // Determine activity level based on count
      let level = 0;
      if (count > 0 && count <= 2) level = 1;
      else if (count > 2 && count <= 5) level = 2;
      else if (count > 5 && count <= 8) level = 3;
      else if (count > 8) level = 4;

      processedData.push({
        date: dateString,
        dayOfWeek: dayOfWeek,
        month: month,
        level: level,
        count: count
      });
    }

    // Group by week for rendering (7 days per column)
    const weeks: (ClientHeatmapDay | null)[][] = [];
    let currentWeek: (ClientHeatmapDay | null)[] = [];
    let firstDayOffset = processedData[0] ? processedData[0].dayOfWeek : 0; // Day of week of the first day in data

    // Fill leading empty days if the year doesn't start on a Sunday
    for (let i = 0; i < firstDayOffset; i++) {
      currentWeek.push(null); // Placeholder for empty cells
    }

    processedData.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) {
      // Fill trailing empty days
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    // Generate month labels positioning
    const monthLabels: { month: string; col: number }[] = [];
    let colIndex = 0;
    let currentMonth = -1; // Track current month to add labels only once per month
    for (let i = 0; i < weeks.length; i++) {
      const firstDayInWeek = weeks[i].find(d => d !== null);
      if (firstDayInWeek && firstDayInWeek.month !== currentMonth) {
        currentMonth = firstDayInWeek.month;
        monthLabels.push({
          month: monthNames[currentMonth],
          col: colIndex // Column index where this month starts
        });
      }
      colIndex++;
    }

    return { weeks, monthLabels };
  }, []);

  // --- Main Data Fetching Effect ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null); // Clear previous errors
      setIsLoggedIn(false); // Assume not logged in until successful fetch

      try {
        const headers = {
          'Content-Type': 'application/json',
          // No 'Authorization' header needed for httpOnly cookies, browser sends automatically
        };

        // Fetch all dashboard data from the single endpoint
        const res = await fetch('http://localhost:5000/api/dashboard', {
          method: 'GET',
          headers: headers,
          credentials: 'include', // IMPORTANT: Ensures cookies are sent with the request
        });

        if (res.status === 401) { // Specifically handle Unauthorized
          setIsLoggedIn(false);
          setError("Please log in to view your personalized dashboard.");
          setDashboardData(null); // Clear any stale data
          return; // Exit early
        }

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(`HTTP error! Status: ${res.status}, Message: ${errorData.message || res.statusText}`);
        }

        const data: DashboardBackendData = await res.json();
        setDashboardData(data); // Set the entire dashboard data object
        setIsLoggedIn(true); // Successfully fetched data, so user is logged in

        // Process heatmap data separately after receiving it
        if (data.heatmap && data.heatmap.dailySubmissions) {
          const { weeks, monthLabels } = generateHeatmapData(data.heatmap.dailySubmissions, 365);
          setHeatmapWeeks(weeks);
          setHeatmapMonthLabels(monthLabels);
        } else {
          setHeatmapWeeks([]);
          setHeatmapMonthLabels([]);
        }

      } catch (err: any) {
        console.error("Failed to fetch dashboard data:", err);
        setError(`Failed to load dashboard: ${err.message}`);
        setDashboardData(null); // Clear data on error
        setIsLoggedIn(false); // Ensure login status is false on any fetch error
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData(); // Trigger fetch on component mount
  }, [generateHeatmapData]); // Re-run if heatmap generator changes

  // Helper to get verdict class
  const getVerdictClass = (verdict: string) => {
    switch (verdict) {
      case 'Accepted': return styles.accepted;
      case 'Wrong Answer': return styles['wrong-answer'];
      case 'Time Limit Exceeded': return styles['time-limit-exceeded'];
      case 'Runtime Error': return styles['runtime-error'];
      case 'Compilation Error': return styles['compilation-error'];
      default: return '';
    }
  };

  // Helper to get difficulty class
  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return styles.easy;
      case 'medium': return styles.medium;
      case 'hard': return styles.hard;
      default: return '';
    }
  };

  // Custom Tooltip for Recharts (Pie/Bar/Line Charts)
  const RechartsCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // For Pie Chart, payload[0].name is the difficulty (Easy, Medium, Hard)
      // For Line Chart, label is the month, payload[0].value is rating
      // For Bar Chart, label is the language, payload[0].value is solved count
      return (
        <div className={styles.rechartsTooltipWrapper}>
          <p className={styles.rechartsTooltipLabel}>{label || payload[0].name}</p>
          <p className={styles.rechartsTooltipItem}>
            {payload[0].name && payload[0].name !== label ? `${payload[0].name}: ` : ''}
            {payload[0].value}
            {payload[0].dataKey === 'rating' ? ' Rating' : ''}
            {payload[0].dataKey === 'solved' ? ' Solved' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  // Render content or loading/error messages
  if (isLoading) {
    return (
      <div className={`${styles.dashboardPageContainer} ${isDarkTheme ? homeStyles.darkTheme : homeStyles.lightTheme}`}>
        <nav className={homeStyles.nav}>
          <Link href="/" className={homeStyles['logo-link']}>
            <div className={homeStyles['logo-group']}>
              <img src="/logo.svg" alt="Codeclash Logo" className={homeStyles['logo-icon']} />
              <span className={homeStyles['logo-text']}>CodeClash</span>
            </div>
          </Link>
          <div className={homeStyles['nav-links']}>
            <Link href="/editor">Compiler</Link>
            <Link href="/problems">Problem</Link>
            <Link href="/dashboard" className={homeStyles.activeNavLink}>Dashboard</Link>
            <Link href="/login">Login</Link>
            <Link href="/signup">
              <button className={homeStyles['btn-primary']}>Sign Up</button>
            </Link>
            <button
              onClick={() => setIsDarkTheme(!isDarkTheme)}
              className={homeStyles['theme-toggle-btn']}
            >
              {isDarkTheme ? '☀' : '🌙'}
            </button>
          </div>
        </nav>
        <main className={styles.mainContent} style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className={styles.loadingMessage}>Loading dashboard data...</div>
        </main>
        <footer className={homeStyles.footer}>
          <div className={homeStyles['footer-content']}>
            <div className={homeStyles['logo-group']}>
              <img src="/logo.svg" alt="Codeclash Logo" className={homeStyles['logo-icon']} />
              <span className={homeStyles['logo-text']}>CodeClash</span>
            </div>
            <div className={homeStyles['footer-links']}>
              <Link href="/about">About Us</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
            </div>
            <div className={homeStyles['social-icons']}>
              <a href="#">G</a>
              <a href="#">T</a>
              <a href="#">L</a>
            </div>
          </div>
          <p className={homeStyles.copyright}>
            © 2025 CODECLASH. All rights reserved.
          </p>
        </footer>
      </div>
    );
  }

  // If not loading and there's an error (e.g., 401 Unauthorized)
  if (error) {
    return (
      <div className={`${styles.dashboardPageContainer} ${isDarkTheme ? homeStyles.darkTheme : homeStyles.lightTheme}`}>
        <nav className={homeStyles.nav}>
          <Link href="/" className={homeStyles['logo-link']}>
            <div className={homeStyles['logo-group']}>
              <img src="/logo.svg" alt="Codeclash Logo" className={homeStyles['logo-icon']} />
              <span className={homeStyles['logo-text']}>CodeClash</span>
            </div>
          </Link>
          <div className={homeStyles['nav-links']}>
            <Link href="/editor">Compiler</Link>
            <Link href="/problems">Problem</Link>
            <Link href="/dashboard" className={homeStyles.activeNavLink}>Dashboard</Link>
            <Link href="/login">Login</Link>
            <Link href="/signup">
              <button className={homeStyles['btn-primary']}>Sign Up</button>
            </Link>
            <button
              onClick={() => setIsDarkTheme(!isDarkTheme)}
              className={homeStyles['theme-toggle-btn']}
            >
              {isDarkTheme ? '☀' : '🌙'}
            </button>
          </div>
        </nav>
        <main className={styles.mainContent} style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className={styles.errorMessage}>{error}</div>
          {!isLoggedIn && ( // Only show login prompt if not logged in
            <p className={styles.loginPrompt}>Please <Link href="/login" className={styles.loginLink}>log in</Link> to view your personalized dashboard.</p>
          )}
        </main>
        <footer className={homeStyles.footer}>
          <div className={homeStyles['footer-content']}>
            <div className={homeStyles['logo-group']}>
              <img src="/logo.svg" alt="Codeclash Logo" className={homeStyles['logo-icon']} />
              <span className={homeStyles['logo-text']}>CodeClash</span>
            </div>
            <div className={homeStyles['footer-links']}>
              <Link href="/about">About Us</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
            </div>
            <div className={homeStyles['social-icons']}>
              <a href="#">G</a>
              <a href="#">T</a>
              <a href="#">L</a>
            </div>
          </div>
          <p className={homeStyles.copyright}>
            © 2025 CODECLASH. All rights reserved.
          </p>
        </footer>
      </div>
    );
  }

  // If not loading and no error, render the dashboard content
  return (
    <div className={`${styles.dashboardPageContainer} ${isDarkTheme ? homeStyles.darkTheme : homeStyles.lightTheme}`}>
      {/* Navigation Bar (Header) */}
      <nav className={homeStyles.nav}>
        <Link href="/" className={homeStyles['logo-link']}>
          <div className={homeStyles['logo-group']}>
            <img src="/logo.svg" alt="Codeclash Logo" className={homeStyles['logo-icon']} />
            <span className={homeStyles['logo-text']}>CodeClash</span>
          </div>
        </Link>

        <div className={homeStyles['nav-links']}>
          <Link href="/editor">Compiler</Link>
          <Link href="/problems">Problem</Link>
          <Link href="/dashboard" className={homeStyles.activeNavLink}>Dashboard</Link> {/* Highlighted */}
          <Link href="/login">Login</Link>
          <Link href="/signup">
            <button className={homeStyles['btn-primary']}>Sign Up</button>
          </Link>
          <button
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            className={homeStyles['theme-toggle-btn']}
          >
            {isDarkTheme ? '☀' : '🌙'}
          </button>
        </div>
      </nav>

      <main className={styles.mainContent}>
        {/* --- Left Sidebar --- */}
        <aside className={styles.sidebar}>
          {/* User Profile in Sidebar */}
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarProfile}>
              <img src={dashboardData?.profile.avatar || "https://placehold.co/120x120/2b2b2b/e0e0e0?text=CM"} alt="User Avatar" className={styles.sidebarAvatar} />
              <h3 className={styles.sidebarUsername}>{dashboardData?.profile.username || "Guest User"}</h3>
              <p className={styles.sidebarRank}>Rank {dashboardData?.profile.rank || "N/A"}</p>
            </div>
          </div>

          {/* Community Stats */}
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarSectionTitle}>Community Stats</h3>
            <div className={styles.statItem}>
              <span>Views</span>
              <span className={styles.statItemValue}>{dashboardData?.community.views || 0}</span>
            </div>
            <div className={styles.statItem}>
              <span>Solutions</span>
              <span className={styles.statItemValue}>{dashboardData?.community.solutions || 0}</span>
            </div>
            <div className={styles.statItem}>
              <span>Discuss</span>
              <span className={styles.statItemValue}>{dashboardData?.community.discuss || 0}</span>
            </div>
            <div className={styles.statItem}>
              <span>Reputation</span>
              <span className={styles.statItemValue}>{dashboardData?.community.reputation || 0}</span>
            </div>
          </div>

          {/* Languages */}
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarSectionTitle}>Languages</h3>
            {(dashboardData?.languages && dashboardData.languages.length > 0) ? (
              dashboardData.languages.map((lang, index) => (
                <div key={index} className={styles.languageItem}>
                  <span>{lang.name}</span>
                  <span className={styles.languageSolvedCount}>{lang.solved} problems solved</span>
                </div>
              ))
            ) : (
              <p className={styles.noDataMessage}>No language data available.</p>
            )}
          </div>
        </aside>

        {/* --- Main Content Panel (Right) --- */}
        <section className={styles.mainPanel}>
          {/* Quick Stats Row (Top of Main Panel) */}
          <div className={styles.quickStatsRow}>
            <div className={styles.statCard}>
              <h3 className={styles.statCardTitle}>Contest Rating</h3>
              <p className={styles.statCardValue}>{dashboardData?.profile.rating || 0}</p>
              <p className={styles.statCardChange}>
                <span className={styles.icon}>↑</span> {dashboardData?.stats.problemsSolvedChange || 0} in last 30 days
              </p>
            </div>
            <div className={styles.statCard}>
              <h3 className={styles.statCardTitle}>Problems Solved</h3>
              <p className={styles.statCardValue}>{dashboardData?.stats.totalSolved || 0}</p>
              <p className={styles.statCardChange}>
                <span className={styles.icon}>↑</span> {dashboardData?.stats.problemsSolvedChange || 0} in last 30 days
              </p>
            </div>
            <div className={styles.statCard}>
              <h3 className={styles.statCardTitle}>Max Rating Achieved</h3>
              <p className={styles.statCardValue}>{dashboardData?.profile.maxRating || "N/A"}</p>
            </div>
            <div className={styles.statCard}>
              <h3 className={styles.statCardTitle}>Current Streak</h3>
              <p className={styles.statCardValue}>{dashboardData?.heatmap.maxStreak || 0} Days</p>
              <p className={styles.statCardChange}>🔥 Keep it up!</p>
            </div>
          </div>

          {/* Performance Overview Section (Charts) */}
          <div className={styles.performanceSection}>
            <div className={styles.chartCard}>
              <h3>Rating History</h3>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData?.performanceTrend || []} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" />
                    <Tooltip
                      wrapperStyle={{ outline: 'none' }}
                      contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-color)' }}
                      itemStyle={{ color: 'var(--accent-light)' }}
                      content={RechartsCustomTooltip}
                    />
                    <Line type="monotone" dataKey="rating" stroke="var(--accent-blue)" strokeWidth={3} dot={{ stroke: 'var(--accent-blue)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.chartCard}>
              <h3>Problems Solved by Difficulty</h3>
              <div className={`${styles.chartContainer} ${styles.difficultyPieChartWrapper}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Easy', value: dashboardData?.stats.easySolved || 0, color: 'var(--status-success)' },
                        { name: 'Medium', value: dashboardData?.stats.mediumSolved || 0, color: 'var(--accent-light)' },
                        { name: 'Hard', value: dashboardData?.stats.hardSolved || 0, color: 'var(--status-error)' },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      labelLine={false}
                    >
                      {[
                        { name: 'Easy', value: dashboardData?.stats.easySolved || 0, color: 'var(--status-success)' },
                        { name: 'Medium', value: dashboardData?.stats.mediumSolved || 0, color: 'var(--accent-light)' },
                        { name: 'Hard', value: dashboardData?.stats.hardSolved || 0, color: 'var(--status-error)' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      wrapperStyle={{ outline: 'none' }}
                      contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-color)' }}
                      itemStyle={{ color: 'var(--accent-light)' }}
                      content={RechartsCustomTooltip}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.difficultyLegend}>
                  {[
                    { name: 'Easy', value: dashboardData?.stats.easySolved || 0, color: 'var(--status-success)' },
                    { name: 'Medium', value: dashboardData?.stats.mediumSolved || 0, color: 'var(--accent-light)' },
                    { name: 'Hard', value: dashboardData?.stats.hardSolved || 0, color: 'var(--status-error)' },
                  ].map((entry, index) => (
                    <div key={index} className={styles.legendItem}>
                      <span className={styles.legendColorBox} style={{ backgroundColor: entry.color }}></span>
                      <span>{entry.name}: <span className={styles.legendValue}>{entry.value}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.chartCard}>
              <h3>Language Proficiency</h3>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData?.languages || []} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" stroke="var(--text-muted)" />
                    <YAxis type="category" dataKey="name" stroke="var(--text-muted)" />
                    <Tooltip
                      wrapperStyle={{ outline: 'none' }}
                      contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-color)' }}
                      itemStyle={{ color: 'var(--accent-light)' }}
                      content={RechartsCustomTooltip}
                    />
                    <Bar dataKey="solved">
                      {(dashboardData?.languages || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={
                            index === 0 ? 'var(--accent-blue)' :
                            index === 1 ? 'var(--accent-main)' :
                            index === 2 ? 'var(--accent-purple)' : 'var(--text-muted)' // Fallback color
                        } />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Submission Heatmap Section */}
          <div className={styles.heatmapSection}>
            <h2 className={styles.sectionHeading}>Submission Activity (Last 365 Days)</h2>
            <div className={styles.heatmapGrid}>
                {/* Day Labels (Sunday to Saturday) */}
                <div className={styles.heatmapLabel}></div> {/* Empty corner */}
                <div className={`${styles.heatmapLabel} ${styles.heatmapDayLabel}`}>Sun</div>
                <div className={`${styles.heatmapLabel} ${styles.heatmapDayLabel}`}>Mon</div>
                <div className={`${styles.heatmapLabel} ${styles.heatmapDayLabel}`}>Tue</div>
                <div className={`${styles.heatmapLabel} ${styles.heatmapDayLabel}`}>Wed</div>
                <div className={`${styles.heatmapLabel} ${styles.heatmapDayLabel}`}>Thu</div>
                <div className={`${styles.heatmapLabel} ${styles.heatmapDayLabel}`}>Fri</div>
                <div className={`${styles.heatmapLabel} ${styles.heatmapDayLabel}`}>Sat</div>

                {/* Month Labels and Heatmap Cells */}
                {heatmapWeeks.length > 0 && heatmapMonthLabels.map((monthLabel, monthIndex) => (
                    <div key={`month-${monthIndex}`} style={{ gridColumn: monthLabel.col + 2, gridRow: 1 }}>
                        <div className={`${styles.heatmapLabel} ${styles.heatmapMonthLabel}`}>
                            {monthLabel.month}
                        </div>
                    </div>
                ))}
                {/* Render heatmap cells only if data is available (after client-side generation) */}
                {heatmapWeeks.length > 0 ? (
                    heatmapWeeks.map((week, weekIndex) => (
                        week.map((day: ClientHeatmapDay | null, dayIndex: number) => (
                            day ? (
                                <div
                                    key={`${weekIndex}-${dayIndex}`}
                                    className={`${styles.heatmapCell} ${styles[`heatmapLevel${day.level}`]}`}
                                    style={{
                                        gridColumn: weekIndex + 2, // +2 for day labels column and first empty cell
                                        gridRow: day.dayOfWeek + 2, // +2 for month labels row and first empty cell
                                    }}
                                    title={`${day.date}: ${day.count} submissions`}
                                ></div>
                            ) : (
                                <div key={`${weekIndex}-${dayIndex}`} className={styles.heatmapCell}></div> // Empty cell
                            )
                        ))
                    ))
                ) : (
                    <div style={{ gridColumn: 'span 54', textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                        No heatmap data available.
                    </div>
                )}
            </div>
          </div>


          {/* Recent Activity & Submissions Section */}
          <div className={styles.recentActivitySection}>
            <h2 className={styles.sectionHeading}>Latest Submissions</h2>
            <div className={styles.submissionList}>
              {(dashboardData?.recentSubmissions && dashboardData.recentSubmissions.length > 0) ? (
                dashboardData.recentSubmissions.map((submission) => (
                  <div key={submission.id} className={styles.submissionCard}>
                    <div className={styles.submissionInfo}>
                      <Link href={`/problems/detail/${submission.problem.replace(/\s/g, '-')}`} className={styles.submissionProblemTitle}>
                        {submission.problem}
                      </Link>
                      <p className={styles.submissionDetails}>
                        {submission.language} • {submission.time}
                      </p>
                    </div>
                    <span className={`${styles.submissionVerdict} ${getVerdictClass(submission.verdict)}`}>
                      {submission.verdict}
                    </span>
                  </div>
                ))
              ) : (
                <p className={styles.noDataMessage}>No recent submissions found.</p>
              )}
            </div>
            <button className={styles.viewAllSubmissionsBtn}>View All Submissions</button>
          </div>

          {/* Suggested Problems / Learning Path Section */}
          <div className={styles.suggestedProblemsSection}>
            <h2 className={styles.sectionHeading}>Recommended for You</h2>
            <div className={styles.problemGrid}>
              {(dashboardData?.personalizedRecommendations && dashboardData.personalizedRecommendations.length > 0) ? (
                dashboardData.personalizedRecommendations.map((problem) => (
                  <div key={problem.id} className={styles.suggestedProblemCard}>
                    <h3 className={styles.suggestedProblemTitle}>{problem.title}</h3>
                    <span className={`${styles.suggestedProblemDifficulty} ${getDifficultyClass(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                    <p className={styles.recommendationReason}>{problem.reason || "No specific reason provided."}</p>
                    <Link href={`/problems/detail/${problem.id}`}>
                      <button className={styles.solveNowBtn}>Solve Now</button>
                    </Link>
                  </div>
                ))
              ) : (
                <p className={styles.noDataMessage}>No personalized recommendations available.</p>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Reusing homepage footer structure and styles */}
      <footer className={homeStyles.footer}>
        <div className={homeStyles['footer-content']}>
          <div className={homeStyles['logo-group']}>
            <img src="/logo.svg" alt="Codeclash Logo" className={homeStyles['logo-icon']} />
            <span className={homeStyles['logo-text']}>CodeClash</span>
          </div>
          <div className={homeStyles['footer-links']}>
            <Link href="/about">About Us</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </div>
          <div className={homeStyles['social-icons']}>
            <a href="#">G</a>
            <a href="#">T</a>
            <a href="#">L</a>
          </div>
        </div>
        <p className={homeStyles.copyright}>
          © 2025 CODECLASH. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
