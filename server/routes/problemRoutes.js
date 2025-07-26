const express = require('express');
const router = express.Router();
const {
  createProblem,
  getAllProblems,
  getProblemById,
  updateProblem,
  deleteProblem,
} = require('../controllers/problemController');

// ✅ Test route to verify the problem router is connected
router.get('/test', (req, res) => {
  console.log("✅ /api/problems/test hit");
  res.send("Problem route working");
});

// ✅ Create a new problem
router.post('/', createProblem);

// ✅ Get all problems
router.get('/', getAllProblems);

// ✅ Get a single problem by ID
router.get('/:id', getProblemById);

// ✅ Update a problem by ID
router.put('/:id', updateProblem);

// ✅ Delete a problem by ID
router.delete('/:id', deleteProblem);

module.exports = router;