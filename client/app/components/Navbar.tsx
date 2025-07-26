'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
    }
  }, [darkMode]);

  return (
    <nav className="navbar full-navbar">
      <Link href="/" className="logo-link">
        <div className="logo-group">
          <img src="/logo.svg" alt="logo" className="logo-icon" />
          <div className="logo">CODECLASH</div>
        </div>
      </Link>

      <div className="nav-links">
        <Link href="/problems">Problems</Link>
        <Link href="/dashboard">Dashboard</Link>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="glow-btn small"
          style={{ marginLeft: '1rem' }}
        >
          {darkMode ? '☀ Light' : '🌙 Dark'}
        </button>
      </div>
    </nav>
  );
}