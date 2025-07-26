// compiler-service/utils/executeC.js
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs-extra"); // fs-extra is already used, good.

const outputPath = path.join(__dirname, "../outputs"); // Directory for compiled binaries

// Ensure the outputs directory exists
fs.ensureDirSync(outputPath); // Synchronously ensures directory exists

// Function to execute C code
// timeLimit: in seconds, passed from problemDetails (default to 5s)
// memoryLimit: in MB, passed from problemDetails (default to 256MB).
// Note: Enforcing memory limits reliably with Node.js `exec` without
// containerization (like Docker) or `ulimit` (Linux-specific) is complex.
// For this example, it's mostly a placeholder unless `ulimit` is pre-configured
// or you use a more advanced execution environment.
const executeC = (codePath, inputPath, timeLimit = 5, memoryLimit = 256) => {
  const jobId = path.basename(codePath).split('.')[0]; // Extract jobId from codePath
  const outputBinaryPath = path.join(outputPath, `${jobId}.out`); // Path to the compiled executable

  return new Promise((resolve) => { // Use resolve for all outcomes, including errors
    // Step 1: Compile the C code
    // Use backticks for string interpolation in compile command
    const compileCommand = `gcc ${codePath} -o ${outputBinaryPath}`;

    exec(compileCommand, (compileErr, _, compileStderr) => {
      if (compileErr) {
        // Compilation Error
        return resolve({
          output: "",
          error: compileStderr,
          verdict: "Compilation Error",
          timeExceeded: false,
          memoryExceeded: false,
          time: "0.00 ms",
          memory: "N/A", // Cannot determine memory for compile errors
          executablePath: null, // No executable generated
        });
      }

      // Step 2: Run the compiled executable with input
      // Use exec's built-in timeout, which sends SIGTERM to the child process.
      const runCommand = `${outputBinaryPath} < ${inputPath}`;

      const startTime = process.hrtime.bigint(); // High-resolution time start

      exec(runCommand, {
        timeout: timeLimit * 1000, // timeout in milliseconds
        killSignal: 'SIGTERM', // Signal to send on timeout
        maxBuffer: 1024 * 1024 * 10, // Increase max buffer to 10MB to avoid "stdout maxBuffer exceeded" errors
      }, (runErr, runStdout, runStderr) => {
        const endTime = process.hrtime.bigint(); // High-resolution time end
        const executionTimeNs = Number(endTime - startTime); // Execution time in nanoseconds
        const executionTimeMs = (executionTimeNs / 1_000_000).toFixed(2); // Convert nanoseconds to milliseconds, 2 decimal places

        let verdict = "Accepted";
        let timeExceeded = false;
        let memoryExceeded = false; // Placeholder
        let errorOutput = null;

        if (runErr) {
          // Check if it's a timeout error (killed by SIGTERM due to `timeout` option)
          if (runErr.killed && runErr.signal === 'SIGTERM') {
            timeExceeded = true;
            verdict = "Time Limit Exceeded";
            errorOutput = `Execution timed out after ${timeLimit} seconds.`;
          } else {
            // Other runtime errors (e.g., segmentation fault, uncaught exception in code)
            verdict = "Runtime Error";
            errorOutput = runStderr || runErr.message || "An unknown runtime error occurred.";
          }
        }

        // Placeholder for memory check. In a real system, you'd parse /proc/<pid>/status or similar,
        // or rely on container resource limits.
        // if (actualMemoryUsage > memoryLimit) {
        //   memoryExceeded = true;
        //   verdict = "Memory Limit Exceeded";
        //   errorOutput = "Memory Limit Exceeded.";
        // }

        resolve({
          output: runStdout,
          error: errorOutput,
          verdict: verdict, // This verdict is internal to executeC, overallVerdict is determined in controller
          timeExceeded: timeExceeded,
          memoryExceeded: memoryExceeded, // Always false with current setup unless external `ulimit` or similar
          time: `${executionTimeMs} ms`, // Formatted time
          memory: "N/A", // Placeholder: True memory usage is hard to capture reliably here.
          executablePath: outputBinaryPath, // Return the path to the compiled executable for cleanup
        });
      });
    });
  });
};

module.exports = executeC;