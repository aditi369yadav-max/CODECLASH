// client/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './home.module.css'; // Import the CSS module

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(true); // State for theme toggle

  useEffect(() => {
    // This effect now unconditionally shows the splash screen for 3.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3500); // Splash duration
    return () => clearTimeout(timer);
  }, []); // Empty dependency array means this runs once on component mount

  if (showSplash) {
    return (
      <div className={styles.splash}>
        <div className={styles['splash-logo-container']}>
          <img src="/logo.svg" alt="Codeclash Logo" className={styles['splash-logo']} />
        </div>
        <div className={styles['splash-text-container']}>
          {"CODECLASH".split("").map((char, idx) => (
            <span
              key={idx}
              className={styles['splash-char']}
              // CORRECTED: Use backticks (`) for template literals
              style={{ animationDelay: `${0.5 + idx * 0.08}s` }} /* Adjust delay for staggered text */
            >
              {char}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    // CORRECTED: Apply the theme class directly to the main container using template literals
    <main className={`${styles.homepage} ${isDarkTheme ? styles.darkTheme : styles.lightTheme}`}>
      {/* Navigation Bar */}
      <nav className={styles.nav}>
        <Link href="/" className={styles['logo-link']}>
          <div className={styles['logo-group']}>
            {/* Use the new SVG logo here */}
            <img src="/logo.svg" alt="Codeclash Logo" className={styles['logo-icon']} />
            {/* Wrap the text in a span with a new class for styling */}
            <span className={styles['logo-text']}>CODECLASH</span>
          </div>
        </Link>

        <div className={styles['nav-links']}>
          <Link href="/problems">
            Problems
          </Link>
          <Link href="/editor">
            Compiler
          </Link>
          <Link href="/dashboard">
            Dashboard
          </Link>
          <Link href="/login">
            Login
          </Link>
          <Link href="/signup">
            <button className={styles['btn-primary']}>
              Sign Up
            </button>
          </Link>
          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            className={styles['theme-toggle-btn']}
          >
            {isDarkTheme ? '☀' : '🌙'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles['hero-visual']}></div>

        <h1 className={styles['hero-title']}>
          The Algorithm Awaits. Are You Ready?


        </h1>
        <p className={styles['hero-subtext']}>
          "Beyond the solution lies understanding. Unravel the complexities, and forge a deeper connection with code."
        </p>
        <div className={styles['hero-btns']}>
          <Link href="/problems">
            <button className={styles['btn-cta']}>
              Explore Problems
            </button>
          </Link>
        </div>
      </section>

      {/* Why Choose CodeClash? Section */}
      <section className={styles['why-choose-section']}>
        <h2 className={styles['section-title']}>
          Why CODECLASH?
        </h2>
        <div className={styles['reason-cards-grid']}>
          {/* Card 1: Blazing Fast Execution */}
          <div className={styles['reason-card']}>
            <div className={styles.icon}>⚡</div>
            <h3>Blazing Fast Execution</h3>
            <p>
              Our optimized infrastructure ensures your code runs and evaluates in milliseconds,
              giving you instant feedback.
            </p>
          </div>

          {/* Card 2: Robust Problem Set */}
          <div className={styles['reason-card']}>
            <div className={styles.icon}>📚</div>
            <h3>Robust Problem Set</h3>
            <p>
              Explore thousands of carefully curated problems across various topics and difficulty
              levels to sharpen your skills.
            </p>
          </div>

          {/* Card 3: Intelligent Judging */}
          <div className={styles['reason-card']}>
            <div className={styles.icon}>🧠</div>
            <h3>Intelligent Judging</h3>
            <p>
              Our AI-powered judge provides detailed insights, optimal solutions, and personalized
              feedback to guide your learning.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles['features-section']}>
        <h2 className={styles['section-title']}>
          Unleash Your Potential with Our Features
        </h2>

        {/* Feature Block 1: Interactive Compiler */}
        <div className={styles['feature-block']}>
          <div className={styles['feature-visual']}>
            <span>&lt;/&gt;</span>
          </div>
          <div className={styles['feature-content']}>
            <h3>Real-time Interactive Compiler</h3>
            <p>
              "Effortlessly write, test, and debug in a versatile, instant environment."
            </p>
          </div>
        </div>

        {/* Feature Block 2: Vast Problem Library (Text Left, Image Right) */}
        <div className={`${styles['feature-block']} ${styles.reverse}`}>
          <div className={styles['feature-visual']}>
            <span>🔗</span>
          </div>
          <div className={styles['feature-content']}>
            <h3>Diverse & Challenging Problem Set</h3>
            <p>
              From beginner-friendly exercises to advanced algorithmic puzzles, our constantly
              updated library caters to all skill levels. Filter by topic, difficulty, and language.
            </p>
          </div>
        </div>

        {/* Feature Block 3: Competitive Contests */}
        <div className={styles['feature-block']}>
          <div className={styles['feature-visual']}>
            <span>🏆</span>
          </div>
          <div className={styles['feature-content']}>
            <h3>Celebrate Every Coding Victory.</h3>
            <p>
              From your first problem to your toughest challenge, mark your milestones and showcase your excellence on our platform
            </p>
          </div>
        </div>

        {/* Feature Block 4: Personalized Dashboard */}
        <div className={`${styles['feature-block']} ${styles.reverse}`}>
          <div className={styles['feature-visual']}>
            <span>📊</span>
          </div>
          <div className={styles['feature-content']}>
            <h3>Track Your Progress, Master Your Skills</h3>
            <p>
              Monitor your performance, review past submissions, identify areas for improvement, and
              personalize your learning journey.
            </p>
            {/* CORRECTED: Removed the extra closing div tag here */}
          </div>
        </div>
      </section>

      {/* Secondary Call to Action / Join Us Section */}
      <section className={styles['cta-section']}>
        <h2 className={styles['section-title']}>
          Ready to Elevate Your Coding Journey?
        </h2>
        <p>
          Join the CODECLASH community today and start building your competitive programming
          prowess.
        </p>
        <div className={styles['cta-buttons']}>
          <Link href="/signup">
            <button className={styles['btn-cta']}>
              Sign Up Now
            </button>
          </Link>
          <Link href="/problems">
            <button className={styles['btn-secondary']}>
              Browse Problems
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles['footer-content']}>
          <div className={styles['logo-group']}>
            {/* Use the new SVG logo here */}
            <img src="/logo.svg" alt="Codeclash Logo" className={styles['logo-icon']} />
            {/* Wrap the text in a span with a new class for styling */}
            <span className={styles['logo-text']}>CodeClash</span>
          </div>
          <div className={styles['footer-links']}>
            <Link href="/about">
              About Us
            </Link>
            <Link href="/contact">
              Contact
            </Link>
            <Link href="/privacy">
              Privacy Policy
            </Link>
            <Link href="/terms">
              Terms of Service
            </Link>
          </div>
          <div className={styles['social-icons']}>
            {/* Placeholder Social Icons - Using simple characters for now */}
            <a href="#">G</a>
            <a href="#">T</a>
            <a href="#">L</a>
          </div>
        </div>
        <p className={styles.copyright}>
          © 2025 CODECLASH. All rights reserved.
        </p>
      </footer>
    </main>
  );
}