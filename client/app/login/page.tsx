// client/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import styles from './login.module.css'; // Import the new local CSS module

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [mounted, setMounted] = useState(false);
  // State to manage theme locally for this page
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true); // Default to dark
  // NEW: State to store and display error messages to the user
  const [errorMessage, setErrorMessage] = useState<string>('');
  // NEW: State to manage loading state for the button
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Read theme from localStorage on mount
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      setIsDarkTheme(storedTheme === 'light' ? false : true); // Set theme based on stored preference
    }
    setMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(''); // Clear any previous error messages
    setLoading(true); // Set loading state to true when submission starts

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        console.log("✅ Login success:", data.user);
        window.location.href = "/dashboard"; // Redirect on successful login
      } else {
        // Login failed, display the message from the backend
        console.error("❌ Login failed:", data.message);
        setErrorMessage(data.message || "An unknown login error occurred."); // Set error message for display
        setForm(prevForm => ({ ...prevForm, password: "" })); // Clear password field for security
      }
    } catch (error) {
      // Network error or other unexpected issues
      console.error("❌ Login error:", error);
      setErrorMessage("Network error or server unavailable. Please try again."); // Set generic error message
    } finally {
      setLoading(false); // Always set loading state to false after attempt
    }
  };

  if (!mounted) return null; // Render nothing until component is mounted and theme is read

  return (
    // Apply the theme class from local styles to the main container
    <main className={`${styles['auth-container']} ${isDarkTheme ? styles.darkTheme : styles.lightTheme}`}>
      <div className={styles['auth-bg-code']}>
        function solve() &#123; return 42; &#125;
      </div>

      <form className={styles['auth-card']} onSubmit={handleSubmit}>
        <h2>Log In</h2>
        {/* NEW: Display error message here if it exists */}
        {errorMessage && (
          <p className={styles['error-message']}>{errorMessage}</p>
        )}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          disabled={loading} // Disable input while loading
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          disabled={loading} // Disable input while loading
        />
        <button type="submit" className={styles['btn-primary']} disabled={loading}>
          {loading ? 'Logging In...' : 'Log In'} {/* Change button text based on loading state */}
        </button>
      </form>
    </main>
  );
}
