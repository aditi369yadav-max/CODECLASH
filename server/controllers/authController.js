const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 🔐 Token creator
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// 🚀 REGISTER
exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  console.log("📥 Register request received:", req.body); // 🔍 Debug log

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // 🚫 Check for existing user
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: "Email or Username already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash: hash });

    const token = createToken(user._id);
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    console.log("✅ New user registered:", user.username);
    res.status(201).json({ user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    console.error("❌ Error in register:", err);
    res.status(500).json({ message: "Something went wrong during registration" });
  }
};

// 🔑 LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log("🔐 Login attempt:", email); // 🪵 Log attempt

  if (!email || !password) {
    return res.status(400).json({ message: "Email and Password required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    user.lastLogin = new Date();
    await user.save();

    const token = createToken(user._id);
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    console.log("✅ Login successful:", user.username);
    res.status(200).json({ user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    console.error("❌ Error in login:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// 🚪 LOGOUT
exports.logout = (req, res) => {
  res.cookie('token', '', { maxAge: 1 });
  res.status(200).json({ message: "Logged out successfully" });
};