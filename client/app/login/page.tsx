// client/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
// No ThemeContext import as per your request
import styles from './login.module.css'; // Import the new local CSS module

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [mounted, setMounted] = useState(false);
  // State to manage theme locally for this page
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true); // Default to dark

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
        window.location.href = "/dashboard";
      } else {
        console.error("❌ Login failed:", data.message);
      }
    } catch (error) {
      console.error("❌ Login error:", error);
    }
  };

  if (!mounted) return null;

  return (
    // Apply the theme class from local styles to the main container
    <main className={`${styles['auth-container']} ${isDarkTheme ? styles.darkTheme : styles.lightTheme}`}>
      <div className={styles['auth-bg-code']}>
        function solve() &#123; return 42; &#125;
      </div>


      <form className={styles['auth-card']} onSubmit={handleSubmit}>
        <h2>Log In</h2>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit" className={styles['btn-primary']}>
          Log In
        </button>
      </form>
    </main>
  );
}
