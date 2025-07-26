// client/app/signup/page.tsx
"use client";

import { useState, useEffect } from "react";
import styles from './signup.module.css'; // Import the new local CSS module

export default function SignupPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [mounted, setMounted] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true); // Default to dark

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      setIsDarkTheme(storedTheme === 'light' ? false : true);
    }
    setMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        console.log("✅ Signup successful:", data.user);
        window.location.href = "/login";
      } else {
        console.error("❌ Signup failed:", data.message);
      }
    } catch (error) {
      console.error("❌ Signup error:", error);
    }
  };

  if (!mounted) return null;

  return (
    <main className={`${styles['auth-container']} ${isDarkTheme ? styles.darkTheme : styles.lightTheme}`}>
      <div className={styles['auth-bg-code']}>
        const register = () =&gt; &#123; return true; &#125;
      </div>

      

      <form className={styles['auth-card']} onSubmit={handleSubmit}>
        <h2>Sign Up</h2>

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          required
        />

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

        {/* FIX: Ensure btn-primary class is correctly referenced with styles object */}
        <button type="submit" className={styles['btn-primary']}>
          Sign Up
        </button>
      </form>
    </main>
  );
}
