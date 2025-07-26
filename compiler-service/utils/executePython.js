// compiler-service/utils/executePython.js
const { exec } = require("child_process");
const path = require("path");

// Function to execute Python code
// timeLimit: in seconds, passed from problemDetails (default to 5s)
// memoryLimit: in MB, passed from problemDetails (default to 256MB).
// Note: Enforcing memory limits reliably for Python with Node.js `exec` without
// containerization (like Docker) or `ulimit` (Linux-specific) is complex.
// For this example, it's mostly a placeholder.
const executePython = (codePath, inputPath, timeLimit = 5, memoryLimit = 256) => { // Added memoryLimit
  return new Promise((resolve) => { // Use resolve for all outcomes, including errors
    // Step 1: Run the Python script with input
    // Use exec's built-in timeout, which sends SIGTERM to the child process.
    const runCommand = `python3 ${codePath} < ${inputPath}`;

    const startTime = process.hrtime.bigint(); // High-resolution time start

    exec(runCommand, {
      timeout: timeLimit * 1000, // timeout in milliseconds
      killSignal: 'SIGTERM', // Signal to send on timeout
      maxBuffer: 1024 * 1024 * 10, // Increase max buffer to 10MB for program output
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
          // Other runtime errors (e.g., Python exceptions, syntax errors caught at runtime)
          // Python errors often go to stderr.
          verdict = "Runtime Error";
          errorOutput = runStderr || runErr.message || "An unknown runtime error occurred.";
        }
      }

      // Placeholder for memory check. Similar challenges as C++/C/Java.
      // Python's memory usage can also be tricky due to its interpreter overhead.
      // if (actualMemoryUsage > memoryLimit) {
      //   memoryExceeded = true;
      //   verdict = "Memory Limit Exceeded";
      //   errorOutput = "Memory Limit Exceeded.";
      // }

      resolve({
        output: runStdout,
        error: errorOutput,
        verdict: verdict, // Internal verdict, overall determined by controller
        timeExceeded: timeExceeded,
        memoryExceeded: memoryExceeded, // Always false with current setup unless external `ulimit` or similar
        time: `${executionTimeMs} ms`, // Formatted time
        memory: "N/A", // Placeholder: True memory usage is hard to capture reliably here.
        executablePath: null, // Python scripts don't produce a separate compiled binary to clean up
      });
    });
  });
};

module.exports = executePython;