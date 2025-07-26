// server/controllers/problemController.js
const Problem = require('../models/Problem');

// 🔥 CREATE a new problem
exports.createProblem = async (req, res) => {
  console.log("🔥 [POST] /api/problems hit");
  console.log("📥 Request Body:", req.body);

  try {
    const newProblem = await Problem.create(req.body);
    console.log("✅ Problem created:", newProblem);
    res.status(201).json(newProblem);
  } catch (err) {
    console.error("❌ Error creating problem:", err.message);
    // Handle duplicate key error specifically for 'code' field
    if (err.code === 11000 && err.keyPattern && err.keyPattern.code) {
      return res.status(400).json({ message: "Problem with this code already exists.", error: err.message });
    }
    res.status(500).json({ message: "Failed to create problem", error: err.message });
  }
};

// 📄 GET all problems with optional filters (difficulty, tag, search)
exports.getAllProblems = async (req, res) => {
  try {
    const { difficulty, tag, search } = req.query;
    const query = {};

    // Filter by difficulty
    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }

    // Filter by tag
    if (tag && tag !== 'All') {
      // Use $in to match if the problem's tags array contains the specified tag
      query.tags = { $in: [new RegExp(tag, 'i')] }; // Case-insensitive tag search
    }

    // Search by title (case-insensitive)
    if (search) {
      query.title = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    const problems = await Problem.find(query).sort({ createdAt: -1 });
    // Corrected: Use backticks for template literal
    console.log(`📦 Returning ${problems.length} problems with filters: ${JSON.stringify(query)}`);
    res.status(200).json(problems);
  } catch (err) {
    console.error("❌ Failed to fetch problems:", err.message);
    res.status(500).json({ message: "Failed to fetch problems", error: err.message });
  }
};

// 🔍 GET a single problem by ID
exports.getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      console.warn("⚠ Problem not found:", req.params.id);
      return res.status(404).json({ message: "Problem not found" });
    }
    res.status(200).json(problem);
  } catch (err) {
    console.error("❌ Error retrieving problem:", err.message);
    res.status(500).json({ message: "Error retrieving problem", error: err.message });
  }
};

// ✏ UPDATE a problem
exports.updateProblem = async (req, res) => {
  try {
    const updated = await Problem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      console.warn("⚠ Problem not found for update:", req.params.id);
      return res.status(404).json({ message: "Problem not found" });
    }
    console.log("🔁 Problem updated:", updated);
    res.status(200).json(updated);
  } catch (err) {
    console.error("❌ Failed to update problem:", err.message);
    // Handle duplicate key error specifically for 'code' field
    if (err.code === 11000 && err.keyPattern && err.keyPattern.code) {
      return res.status(400).json({ message: "Problem with this code already exists.", error: err.message });
    }
    res.status(500).json({ message: "Failed to update problem", error: err.message });
  }
};

// ❌ DELETE a problem
exports.deleteProblem = async (req, res) => {
  try {
    const deleted = await Problem.findByIdAndDelete(req.params.id);
    if (!deleted) {
      console.warn("⚠ Problem not found for deletion:", req.params.id);
      return res.status(404).json({ message: "Problem not found" });
    }
    console.log("🗑 Problem deleted:", deleted.code);
    res.status(200).json({ message: "Problem deleted successfully" });
  } catch (err) {
    console.error("❌ Failed to delete problem:", err.message);
    res.status(500).json({ message: "Failed to delete problem", error: err.message });
  }
};