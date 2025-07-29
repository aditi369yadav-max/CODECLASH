// client/app/dashboard/page.tsx
'use client';

// Import all necessary interfaces from your types file
import { DashboardBackendData } from '../types/dashboard';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie // REMOVED: Legend
} from 'recharts';

// Import shared styles
import homeStyles from '../home.module.css'; // For Navbar and Footer
import styles from './dashboard.module.css'; // For Dashboard specific styles


// Client-side processed Heatmap Day interface (This one is specific to the frontend processing, so it stays here)
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

    // Generate data for the last 'numDays' days
    for (let i = 0; i < numDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (numDays - 1 - i)); // Iterate from earliest to latest date
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

    // Calculate the number of leading nulls needed for the first week
    // The first day of data's dayOfWeek (0=Sun, 6=Sat) determines how many nulls precede it.
    // E.g., if first day is Wed (dayOfWeek 3), we need 3 nulls for Sun, Mon, Tue.
    const firstDayInProcessedData = processedData[0];
    const firstDayActualDayOfWeek = firstDayInProcessedData ? firstDayInProcessedData.dayOfWeek : 0;

    for (let i = 0; i < firstDayActualDayOfWeek; i++) {
        currentWeek.push(null);
    }

    // currentColumnIndex was unused, so removed.
    const monthLabels: { month: string; col: number }[] = [];
    let lastMonthAdded = -1;

    processedData.forEach((day, index) => {
        // Add month label for the first day of a new month in the first week of that month
        if (day.month !== lastMonthAdded) {
            // Find the week index where this month starts.
            // This is complex as it depends on the exact grid layout.
            // For simplicity, we'll mark the column index of the first day of the month.
            // The actual rendering logic in JSX will need to place this correctly.
            const totalDaysProcessedSoFar = index + firstDayActualDayOfWeek;
            const weekIndex = Math.floor(totalDaysProcessedSoFar / 7);

            monthLabels.push({
                month: monthNames[day.month],
                col: weekIndex // This 'col' refers to the column in the grid
            });
            lastMonthAdded = day.month;
        }

        currentWeek.push(day);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
            // currentColumnIndex++; // Removed as it was unused
        }
    });

    if (currentWeek.length > 0) {
      // Fill trailing empty days if the last week is not full
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_CRUD_BACKEND_URL}/api/dashboard`, {
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

      } catch (err: unknown) {
        console.error("Failed to fetch dashboard data:", err);
        let errorMessage = "An unknown error occurred.";
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(`Failed to load dashboard: ${errorMessage}`);
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

  // Type for Recharts Tooltip Props
  interface RechartsTooltipProps {
    active?: boolean;
    payload?: Array<{ // <-- FIXED: More specific type for payload
      dataKey?: string;
      name?: string;
      value: number; // Assuming value is always a number for charts
      payload?: { // Recharts sometimes nests original data here
        [key: string]: unknown; // Use unknown for nested payload if its structure varies
      };
      // Add other properties if you consistently use them and want type safety
      // e.g., color?: string;
    }>;
    label?: string | number;
  }

  // Custom Tooltip for Recharts (Pie/Bar/Line Charts)
  const RechartsCustomTooltip = ({ active, payload, label }: RechartsTooltipProps) => {
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
            {payload[0].dataKey === 'solved' || payload[0].dataKey === 'problemsSolved' ? ' Solved' : ''} {/* Adjusted for 'problemsSolved' */}
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
              <Image src="/logo.svg" alt="Codeclash Logo" width={32} height={32} className={homeStyles['logo-icon']} /> {/* FIXED: Used Image component */}
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
              onClick={() => setIsDarkTheme(!isDarkTheme)} // CORRECTED: Toggles the state
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
              <Image src="/logo.svg" alt="Codeclash Logo" width={32} height={32} className={homeStyles['logo-icon']} /> {/* FIXED: Used Image component */}
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
              <Image src="/logo.svg" alt="Codeclash Logo" width={32} height={32} className={homeStyles['logo-icon']} /> {/* FIXED: Used Image component */}
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
              onClick={() => setIsDarkTheme(!isDarkTheme)} // CORRECTED: Toggles the state
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
              <Image src="/logo.svg" alt="Codeclash Logo" width={32} height={32} className={homeStyles['logo-icon']} /> {/* FIXED: Used Image component */}
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
            &copy; 2025 CODECLASH. All rights reserved.
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
            <Image src="/logo.svg" alt="Codeclash Logo" width={32} height={32} className={homeStyles['logo-icon']} /> {/* FIXED: Used Image component */}
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
            onClick={() => setIsDarkTheme(!isDarkTheme)} // CORRECTED: Toggles the state
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
              {/* Using a placeholder image, so Image component is fine here too */}
              <Image src={dashboardData?.profile.avatar || "https://placehold.co/120x120/2b2b2b/e0e0e0?text=CM"} alt="User Avatar" width={120} height={120} className={styles.sidebarAvatar} /> {/* FIXED: Used Image component */}
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
                  <span className={styles.languageSolvedCount}>{lang.problemsSolved} problems solved</span> {/* Corrected from lang.solved */}
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
                    <XAxis dataKey="monthYear" stroke="var(--text-muted)" /> {/* Corrected from 'name' to 'monthYear' */}
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
                      {(dashboardData?.stats.easySolved !== undefined && dashboardData?.stats.mediumSolved !== undefined && dashboardData?.stats.hardSolved !== undefined) && // Added conditional check
                        [
                          { name: 'Easy', value: dashboardData.stats.easySolved, color: 'var(--status-success)' },
                          { name: 'Medium', value: dashboardData.stats.mediumSolved, color: 'var(--accent-light)' },
                          { name: 'Hard', value: dashboardData.stats.hardSolved, color: 'var(--status-error)' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))
                      }
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
                    <Bar dataKey="problemsSolved"> {/* Corrected from dataKey="solved" to "problemsSolved" */}
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
                {/* Empty cell for the top-left corner */}
                <div className={styles.heatmapLabel}></div>

                {/* Month Labels (horizontal at the top) */}
                {heatmapMonthLabels.map((monthLabel, index) => (
                    <div
                        key={`month-label-${index}`}
                        className={`${styles.heatmapLabel} ${styles.heatmapMonthLabel}`}
                        style={{ gridColumn: monthLabel.col + 2, gridRow: 1 }} // +2 for day labels column and the empty corner
                    >
                        {monthLabel.month}
                    </div>
                ))}

                {/* Day Labels (vertical on the left) */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, index) => (
                    <div
                        key={`day-label-${index}`}
                        className={`${styles.heatmapLabel} ${styles.heatmapDayLabel}`}
                        style={{ gridColumn: 1, gridRow: index + 2 }} // +2 for the month labels row and empty corner
                    >
                        {dayName}
                    </div>
                ))}

                {/* Heatmap Cells */}
                {heatmapWeeks.length > 0 ? (
                    heatmapWeeks.map((week, weekIndex) => (
                        week.map((day: ClientHeatmapDay | null, dayIndex: number) => (
                            day ? (
                                <div
                                    key={`${weekIndex}-${dayIndex}`}
                                    className={`${styles.heatmapCell} ${styles[`heatmapLevel${day.level}`]}`}
                                    style={{
                                        gridColumn: weekIndex + 2, // +2 for day labels column and the empty corner
                                        gridRow: day.dayOfWeek + 2, // +2 for month labels row and the empty corner
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

          {/* Recent Submissions */}
          <div className={styles.recentSubmissionsSection}>
            <h2 className={styles.sectionHeading}>Recent Submissions</h2>
            {(dashboardData?.recentSubmissions && dashboardData.recentSubmissions.length > 0) ? (
              <div className={styles.recentSubmissionsList}>
                {dashboardData.recentSubmissions.map((submission, index) => (
                  <div key={index} className={styles.submissionItem}>
                    <div className={styles.submissionProblem}>
                      <Link href={`/problems/${submission.id}`} className={styles.problemLink}>
                        {submission.problem}
                      </Link>
                      <span className={`${styles.submissionVerdict} ${getVerdictClass(submission.verdict)}`}>
                        {submission.verdict}
                      </span>
                    </div>
                    <div className={styles.submissionDetails}>
                      <span className={styles.submissionLanguage}>{submission.language}</span>
                      <span className={styles.submissionTime}>{submission.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noDataMessage}>No recent submissions.</p>
            )}
          </div>

        {/* Personalized Recommendations */}
          {/*
          <div className={`${styles.recommendationsSection} ${styles.dashboardCard}`}>
            <h2 className={styles.sectionHeading}>Personalized Recommendations</h2>
            {(dashboardData?.personalizedRecommendations && dashboardData.personalizedRecommendations.length > 0) ? (
              <div className={styles.recommendationsList}>
                {dashboardData.personalizedRecommendations.map((rec, index) => (
                  <div key={index} className={styles.recommendationItem}>
                    <Link href={`/problems/${rec.id}`} className={styles.problemLink}>
                      {rec.title}
                    </Link>
                    <span className={`${styles.recommendationDifficulty} ${getDifficultyClass(rec.difficulty)}`}>
                      {rec.difficulty}
                    </span>
                    {rec.reason && <p className={styles.recommendationReason}>{rec.reason}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noDataMessage}>No personalized recommendations available at this time.</p>
            )}
          </div>
          */}

          {/* Achievement Timeline */}
          <div className={styles.achievementTimelineSection}>
            <h2 className={styles.sectionHeading}>Achievement Timeline</h2>
            {(dashboardData?.achievementTimeline && dashboardData.achievementTimeline.length > 0) ? (
              <div className={styles.timelineList}>
                {dashboardData.achievementTimeline.map((achievement, index) => (
                  <div key={index} className={styles.timelineItem}>
                    <span className={styles.timelineDate}>{new Date(achievement.date).toLocaleDateString()}</span>
                    <p className={styles.timelineDescription}>
                      {achievement.icon && <span className={styles.timelineIcon}>{achievement.icon}</span>}
                      {achievement.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noDataMessage}>No achievements recorded yet.</p>
            )}
          </div>

          {/* Skill Tree Progress */}
          <div className={styles.skillTreeSection}>
            <h2 className={styles.sectionHeading}>Skill Tree Progress</h2>
            {dashboardData?.skillTreeProgress && Object.keys(dashboardData.skillTreeProgress).length > 0 ? (
              <div className={styles.skillList}>
                {Object.entries(dashboardData.skillTreeProgress).map(([skillName, progress], index) => (
                  <div key={index} className={styles.skillItem}>
                    <span className={styles.skillName}>{skillName}</span>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className={styles.progressValue}>{progress}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noDataMessage}>Skill tree progress not available.</p>
            )}
          </div>

          {/* Streaks */}
          <div className={styles.streaksSection}>
            <h2 className={styles.sectionHeading}>Streaks</h2>
            {dashboardData?.streaks && Object.keys(dashboardData.streaks).length > 0 ? (
              <div className={styles.streaksList}>
                {Object.entries(dashboardData.streaks).map(([streakName, streakValue], index) => (
                  <div key={index} className={styles.streakItem}>
                    <span className={styles.streakName}>{
                      streakName === 'dailySolveStreak' ? 'Daily Solve Streak' :
                      streakName === 'hardProblemStreak' ? 'Hard Problem Streak' :
                      streakName === 'optimalSolutionStreak' ? 'Optimal Solution Streak' :
                      streakName // Fallback for other streak names
                    }</span>
                    <span className={styles.streakValue}>{streakValue} {typeof streakValue === 'number' ? 'Days' : ''}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noDataMessage}>No streak data available.</p>
            )}
          </div>

        </section>
      </main>

      <footer className={homeStyles.footer}>
        <div className={homeStyles['footer-content']}>
          <div className={homeStyles['logo-group']}>
            <Image src="/logo.svg" alt="Codeclash Logo" width={32} height={32} className={homeStyles['logo-icon']} /> {/* FIXED: Used Image component */}
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
          &copy; 2025 CODECLASH. All rights reserved.
        </p>
      </footer>
    </div>
  );
}