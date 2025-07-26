// compiler-service/utils/generateInputFile.js
const fs = require('fs-extra');
const path = require('path');
const { v4: uuid } = require('uuid');

const codesDir = path.join(__dirname, '../codes'); // Use the same base directory as generateFile

// Ensure the base directory for code files exists when the module is loaded
fs.ensureDirSync(codesDir);

/**
 * Generates an input file with the given input content.
 *
 * @param {string} input - The input content to write to the file.
 * @returns {Promise<string>} The full path to the generated input file.
 */
const generateInputFile = async (input) => {
    const jobId = uuid();
    const inputPath = path.join(codesDir, `${jobId}.txt`); // Input files will also be unique

    await fs.writeFile(inputPath, input);
    console.log(`[${new Date().toISOString()}] generateInputFile: Generated input file: ${inputPath}`);
    return inputPath;
};

module.exports = generateInputFile; // Export ONLY the generateInputFile function directly