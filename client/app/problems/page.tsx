// client/app/problems/page.tsx
'use client';
import Image from 'next/image';
import { useEffect, useState } from "react";
import Link from 'next/link';
import styles from './problem-list.module.css'; // Import Problem LIST specific styles
import homeStyles from '../home.module.css'; // Import general home styles for shared components (Navbar/Footer)

interface Problem {
  _id: string;
  title: string;
  code: string;
  description: string;
  difficulty: string;
  timeLimit: number;
  createdAt: string;
  tags: string[]; // Added tags property
}

export default function ProblemsPage() {
  // Removed 'problems' state as it was assigned but never used for rendering or other logic.
  // 'filtered' will now directly hold the data fetched from the backend (already filtered).
  const [filtered, setFiltered] = useState<Problem[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("All");
  const [tagFilter, setTagFilter] = useState<string>("All");
  const [search, setSearch] = useState<string>("");
  const [isDarkTheme, setIsDarkTheme] = useState(true); // Assuming dark theme for context
  const [allTags, setAllTags] = useState<string[]>([]); // To store all unique tags from fetched problems

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        // Construct URL with filters
        const queryParams = new URLSearchParams();
        if (difficultyFilter !== "All") {
          queryParams.append("difficulty", difficultyFilter);
        }
        if (tagFilter !== "All") {
          queryParams.append("tag", tagFilter);
        }
        if (search.trim()) {
          queryParams.append("search", search.trim());
        }

        // --- IMPORTANT: This is the updated API call ---
        // CORRECTED: Use backticks for template literal in fetch URL
     const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_CRUD_BACKEND_URL}/api/problems?${queryParams.toString()}`); // Your backend API URL
        // --- END IMPORTANT ---

        if (!response.ok) {
          // CORRECTED: Use backticks for template literal in Error message
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Problem[] = await response.json();

        // Removed setProblems(data); as 'problems' state is no longer needed.
        setFiltered(data); // 'filtered' is now the single source of truth for the displayed problems

        // Extract all unique tags from the fetched data to populate the tag filter buttons
        const uniqueTags = new Set<string>();
        data.forEach(p => {
          if (p.tags && Array.isArray(p.tags)) { // Ensure 'tags' exists and is an array
            p.tags.forEach(tag => uniqueTags.add(tag));
          }
        });
        // Add 'All' option and sort unique tags alphabetically
        setAllTags(['All', ...Array.from(uniqueTags).sort()]);

      } catch (error) {
        console.error("Failed to fetch problems:", error);
        // Optionally set an error state here to display a message to the user in the UI
      }
    };

    fetchProblems();
  }, [difficultyFilter, tagFilter, search]); // Re-run this effect whenever filters or search change

  const getDifficultyClass = (difficulty: string): string => {
    switch (difficulty) {
      case "Easy":
        return styles.difficultyEasy;
      case "Medium":
        return styles.difficultyMedium;
      case "Hard":
        return styles.difficultyHard;
      default:
        return '';
    }
  };

  return (
    // CORRECTED: Use backticks for template literal
    <div className={`${styles.problemsPageContainer} ${isDarkTheme ? homeStyles.darkTheme : homeStyles.lightTheme}`}>
      {/* Navigation Bar (Header) - Reusing homepage nav structure and styles */}
      <nav className={homeStyles.nav}>
        <Link href="/" className={homeStyles['logo-link']}>
          <div className={homeStyles['logo-group']}>
            <Image
              src="/logo.svg"
              alt="Codeclash Logo"
              width={32}
              height={32}
              className={homeStyles['logo-icon']}
            />

            <span className={homeStyles['logo-text']}>CodeClash</span>
          </div>
        </Link>

        <div className={homeStyles['nav-links']}>
          <Link href="/editor">Compiler</Link>
          <Link href="/problems" className={homeStyles.activeNavLink}>Problem</Link> {/* Highlighted */}
          <Link href="/dashboard">Dashboard</Link>
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
        <h1 className={styles.pageTitle}>
          <Image
            src="/problem-icon.svg"
            alt="Problem Icon"
            width={32}
            height={32}
            className={styles.pageTitleIcon}
          />

          <span className={styles.pageTitleText}>Algorithmic Challenges</span>
        </h1>

        {/* Filters and Search */}
        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Difficulty:</label>
            <div className={styles.difficultyFilters}>
              {['All', 'Easy', 'Medium', 'Hard'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficultyFilter(d)}
                  // CORRECTED: Use backticks for template literal in className
                  className={`${styles.filterButton} ${difficultyFilter === d ? styles.activeFilter : ''}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Tags:</label>
            <div className={styles.tagFilters}>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tag)}
                  // CORRECTED: Use backticks for template literal in className
                  className={`${styles.filterButton} ${tagFilter === tag ? styles.activeFilter : ''}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            placeholder="Search problems by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Problems Table */}
        <div className={styles.tableContainer}>
          <table className={styles.problemsTable}>
            <thead>
              {/* Ensure no whitespace between <tr> and <th> elements */}
              <tr>
                <th className={styles.tableHeader}>#</th>
                <th className={styles.tableHeader}>Title</th>
                <th className={styles.tableHeader}>Difficulty</th>
                <th className={styles.tableHeader}>Tags</th>
                <th className={styles.tableHeader}>Time Limit</th>
                <th className={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((prob, index) => (
                // Ensure no whitespace between <tr> and <td> elements
                <tr key={prob._id} className={styles.tableRow}>
                  <td className={styles.tableCell}>{index + 1}</td>
                  <td className={styles.tableCellTitle}>{prob.title}</td>
                  <td className={`${styles.tableCell} ${getDifficultyClass(prob.difficulty)}`}>
                    {prob.difficulty}
                  </td>
                  <td className={styles.tableCellTags}>
                    <div className={styles.tagsDisplay}>
                      {prob.tags && prob.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className={styles.tagBadgeSmall}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={styles.tableCell}>{prob.timeLimit}s</td>
                  <td className={styles.tableCell}>
                    {/* CORRECTED: Use backticks for template literal in href */}
                    <Link href={`/problems/detail/${prob._id}`}>
                      <button className={styles.solveButton}>
                        Solve
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.noProblemsFound}>
                    No problems found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Footer - Reusing homepage footer structure and styles */}
      <footer className={homeStyles.footer}>
        <div className={homeStyles['footer-content']}>
          <div className={homeStyles['logo-group']}>
            <Image
              src="/logo.svg"
              alt="Codeclash Logo"
              width={32}
              height={32}
              className={homeStyles['logo-icon']}
            />
            <span className={homeStyles['logo-text']}>CODECLASH</span>
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