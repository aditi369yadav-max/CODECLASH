// compiler-service/generateAiResponse.js

// Load environment variables from .env file.
// This allows you to keep your GOOGLE_API_KEY secure and outside of your code.
require('dotenv').config();

// Import the GoogleGenerativeAI class from the official SDK.
// Ensure you have installed this package: `npm install @google/generative-ai dotenv`
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Retrieve the API key from environment variables.
// It will be loaded from your .env file locally, or passed via docker-compose.yml in Docker.
const API_KEY = process.env.GOOGLE_API_KEY;

// Basic check to ensure the API key is available.
// If not, it will log an error and throw an exception to prevent the application from proceeding without it.
if (!API_KEY) {
    console.error('Error: GOOGLE_API_KEY is not set. Please ensure it is in your .env file or Docker environment variables.');
    throw new Error('GOOGLE_API_KEY is not configured.');
}

// Initialize the Generative AI client with your API key.
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Generates an AI response using the Gemini 2.0 Flash model.
 * @param {string} code The code snippet to be reviewed by the AI.
 * @param {string} [language="javascript"] The programming language of the code. Defaults to 'javascript'.
 * @returns {Promise<string>} A promise that resolves to the AI-generated text response.
 * @throws {Error} If there's an issue with API key, model interaction, or content generation.
 */
async function generateAIResponse(code, language = "javascript") {
    try {
        // Specify the model to use. As requested, we are using "gemini-2.0-flash".
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Construct the prompt for the AI. This guides the AI on what kind of feedback to provide.
        const prompt = `You are a coding assistant. Analyze the following ${language} code for common issues, efficiency, correctness, and style. Provide a concise summary of your feedback in 2-3 sentences ONLY. Do not include code examples, detailed explanations, or line-by-line analysis. Focus on the main actionable points.

Code:
\`\`\`${language}
${code}
\`\`\`

Provide your response in a clear and concise manner.`;

        // Send the prompt to the Gemini model and await the response.
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text(); // Extract the text content from the AI's response.
        return text;
    } catch (error) {
        console.error("Error generating AI response:", error);
        // Re-throw the error with a more descriptive message to be caught by the calling function (e.g., in app.js).
        throw new Error(`AI generation failed: ${error.message}`);
    }
}

// Export the function so it can be imported and used in other files, like app.js.
module.exports = generateAIResponse;