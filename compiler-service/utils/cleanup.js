// compiler-service/utils/cleanup.js
const fs = require("fs-extra"); // fs-extra is excellent for file operations

/**
 * Cleans up temporary files generated during code compilation and execution.
 *
 * @param {string | null | undefined} codePath - The path to the source code file (e.g., '.cpp', '.py').
 * @param {string | null | undefined} inputPath - The path to the input file used for execution.
 * @param {string | null | undefined} executablePath - The path to the compiled executable or class directory (e.g., '.out', '.class' folder).
 * This is distinct from the program's stdout output.
 * @param {string | null | undefined} programOutputPath - The path to a file where the program's stdout was redirected (if applicable).
 */
const cleanupFiles = async (codePath, inputPath, executablePath, programOutputPath) => {
  try {
    // Clean up source code file
    if (codePath) {
      await fs.remove(codePath);
    }

    // Clean up input file
    if (inputPath) {
      await fs.remove(inputPath);
    }

    // Clean up compiled executable or class files/directories
    // This is the 'outputPath' that `executeCpp`, `executeJava` etc. return as the compiled artifact.
    if (executablePath) {
      // For Java, the executablePath might be a directory (e.g., './temp/java_files/Main.class' parent dir)
      // For C++/C, it's the .out file
      await fs.remove(executablePath);
    }

    // Clean up the actual program's output file, if it was written to a file
    // In most simple `exec` calls, output is returned as a string, not a file.
    // This parameter is added for future extensibility if you decide to redirect stdout to a file.
    if (programOutputPath) {
      await fs.remove(programOutputPath);
    }

  } catch (err) {
    console.error("Error during file cleanup:", err);
    // It's generally good practice not to rethrow errors in cleanup functions
    // as cleanup should ideally not block the main application flow,
    // especially after a primary operation (like code execution) has completed.
  }
};

module.exports = cleanupFiles;