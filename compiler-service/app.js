// compiler-service/app.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const compilerRoutes = require("./routes/compilerRoutes");
const generateAiResponse = require("./generateAiResponse"); // Import the new AI function

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Compiler Service is Alive!");
});

app.use("/run", compilerRoutes);

app.post("/ai-review", async (req, res) => {
  const { code, language } = req.body;

  if (code === undefined || code.trim() === '') {
    return res.status(400).json({
      success: false,
      error: "Empty code! Please provide some code to review."
    });
  }

  try {
    const aiResponse = await generateAiResponse(code, language);
    res.json({
      success: true,
      aiFeedback: aiResponse
    });
  } catch (error) {
    console.error('Error in /ai-review:', error.message);
    res.status(500).json({
      success: false,
      error: "An internal server error occurred while reviewing the code. " + error.message
    });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🛠 Compiler server running on port ${PORT}`);
});