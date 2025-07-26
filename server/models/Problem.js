// server/models/Problem.js
const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true, // like "SUM1001"
  },
  description: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true,
  },
  timeLimit: {
    type: Number, // In seconds
    default: 2,
  },
  tags: [ // New field for tags
    {
      type: String,
      trim: true // Ensures no leading/trailing whitespace
    }
  ],
  testCases: [
    {
      input: String,
      expectedOutput: String,
      isHidden: {
        type: Boolean,
        default: false,
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Problem', problemSchema);