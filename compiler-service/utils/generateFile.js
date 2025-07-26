// compiler-service/utils/generateFile.js
const fs = require("fs-extra");
const path = require("path");
const { v4: uuid } = require("uuid"); // Ensure uuid is imported

const codesDir = path.join(__dirname, "../codes");

// Ensure the base directory for code files exists when the module is loaded
fs.ensureDirSync(codesDir);

/**
 * Generates a code file with the given language and code content.
 * For Java, it ensures the file is named 'Main.java' if the public class is 'Main'.
 * For other languages, it uses a unique UUID-based filename.
 *
 * @param {string} language - The programming language (e.g., "cpp", "java", "python", "c").
 * @param {string} code - The code content to write to the file.
 * @returns {Promise<string>} The full path to the generated code file.
 */
const generateFile = async (language, code) => {
    let fileName;
    let filePath;

    if (language === 'java') {
        // Java requires the public class name to match the file name.
        // Assuming your boilerplate always uses 'public class Main'.
        fileName = `Main.java`;
        filePath = path.join(codesDir, fileName);
    } else {
        // For other languages, use a unique UUID to prevent conflicts.
        const jobId = uuid();
        let extension = '';
        if (language === 'cpp') {
            extension = 'cpp';
        } else if (language === 'python') {
            extension = 'py';
        } else if (language === 'c') {
            extension = 'c';
        } else {
            extension = 'txt'; // Fallback for unknown languages or simple text
        }
        fileName = `${jobId}.${extension}`;
        filePath = path.join(codesDir, fileName);
    }

    await fs.writeFile(filePath, code);
    console.log(`[${new Date().toISOString()}] generateFile: Generated code file: ${filePath} for language: ${language}`);
    return filePath;
};

module.exports = generateFile; // Export ONLY the generateFile function directly