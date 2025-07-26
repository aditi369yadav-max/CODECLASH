// compiler-service/utils/executeCpp.js
const { exec, spawn } = require("child_process");
const path = require("path");
const fs = require("fs-extra"); // fs-extra is good for ensureDirSync

const outputPath = path.join(__dirname, "../outputs");

fs.ensureDirSync(outputPath);

const executeCpp = (codePath, inputPath, timeLimit = 5, memoryLimit = 256) => {
    console.log(`[${new Date().toISOString()}] executeCpp: Starting for codePath: ${codePath}, inputPath: ${inputPath}`);
    const jobId = path.basename(codePath).split('.')[0];
    const outputBinaryPath = path.join(outputPath, `${jobId}.out`);

    return new Promise((resolve) => {
        // Step 1: Compile the C++ code
        const compileCommand = `g++ ${codePath} -o ${outputBinaryPath}`;
        console.log(`[${new Date().toISOString()}] executeCpp: Compile command: ${compileCommand}`);

        exec(compileCommand, (compileErr, _, compileStderr) => {
            if (compileErr) {
                console.error(`[${new Date().toISOString()}] executeCpp: Compilation failed for ${codePath}: ${compileStderr}`);
                return resolve({
                    output: "",
                    error: compileStderr,
                    verdict: "Compilation Error",
                    timeExceeded: false,
                    memoryExceeded: false,
                    time: "0.00 ms",
                    memory: "N/A",
                    executablePath: null,
                    compileError: true
                });
            }
            console.log(`[${new Date().toISOString()}] executeCpp: Compilation successful for ${codePath}`);

            let runStdout = '';
            let runStderr = '';
            let executionTimeMs = "N/A";
            let verdict = "Accepted";
            let timeExceeded = false;
            let memoryExceeded = false;
            let errorOutput = null;

            const startTime = process.hrtime.bigint();
            console.log(`[${new Date().toISOString()}] executeCpp: Starting execution of ${outputBinaryPath}`);

            const child = spawn(outputBinaryPath, [], {
                stdio: ['pipe', 'pipe', 'pipe'] // stdin, stdout, stderr are piped
            });

            // --- MODIFIED HERE ---
            // Only create and pipe input stream if inputPath is provided and the file exists
            if (inputPath && fs.existsSync(inputPath)) {
                const inputStream = fs.createReadStream(inputPath);
                inputStream.on('error', (err) => {
                    console.error(`[${new Date().toISOString()}] executeCpp: Input stream error for ${inputPath}: ${err.message}`);
                    // You might want to resolve with an error verdict here, or handle it as a runtime error.
                    // For now, it will just proceed with potentially no input to the child.
                });
                inputStream.pipe(child.stdin);
                console.log(`[${new Date().toISOString()}] executeCpp: Input stream piped to child.stdin from ${inputPath}`);
            } else {
                // If no input path, or path is invalid, close stdin immediately to signal EOF to the child process
                child.stdin.end();
                console.log(`[${new Date().toISOString()}] executeCpp: No valid input path provided or file does not exist. Child stdin closed immediately.`);
            }
            // --- END MODIFIED ---


            const timeout = setTimeout(() => {
                console.warn(`[${new Date().toISOString()}] executeCpp: Timeout reached for ${outputBinaryPath}. Killing process.`);
                child.kill('SIGTERM'); // Send SIGTERM for graceful shutdown
                timeExceeded = true;
                verdict = "Time Limit Exceeded";
                errorOutput = `Execution timed out after ${timeLimit} seconds.`;
            }, timeLimit * 1000);

            child.stdout.on('data', (data) => {
                runStdout += data.toString();
                console.log(`[${new Date().toISOString()}] executeCpp: stdout data received: ${data.toString().trim()}`);
            });

            child.stderr.on('data', (data) => {
                runStderr += data.toString();
                console.log(`[${new Date().toISOString()}] executeCpp: stderr data received: ${data.toString().trim()}`);
            });

            child.on('close', (code) => {
                clearTimeout(timeout);
                const endTime = process.hrtime.bigint();
                executionTimeMs = (Number(endTime - startTime) / 1_000_000).toFixed(2);
                console.log(`[${new Date().toISOString()}] executeCpp: Child process closed with code ${code}. Execution time: ${executionTimeMs} ms`);

                if (timeExceeded) {
                    // Verdict already set by timeout handler
                } else if (code !== 0) {
                    verdict = "Runtime Error";
                    errorOutput = runStderr || `Process exited with code ${code}.`;
                } else if (runStderr) {
                    // Even if code is 0, if there's stderr, it's usually a runtime issue
                    verdict = "Runtime Error";
                    errorOutput = runStderr;
                }

                resolve({
                    output: runStdout,
                    error: errorOutput,
                    verdict: verdict,
                    timeExceeded: timeExceeded,
                    memoryExceeded: memoryExceeded,
                    time: `${executionTimeMs} ms`,
                    memory: "N/A", // Memory monitoring is more complex and usually requires a separate tool or platform features.
                    executablePath: outputBinaryPath,
                    compileError: false
                });
            });

            child.on('error', (err) => {
                clearTimeout(timeout);
                console.error(`[${new Date().toISOString()}] executeCpp: Child process error (spawn failed): ${err.message}`);
                verdict = "Internal Error";
                errorOutput = `Failed to start process: ${err.message}`;
                resolve({
                    output: "",
                    error: errorOutput,
                    verdict: verdict,
                    timeExceeded: false,
                    memoryExceeded: false,
                    time: "N/A",
                    memory: "N/A",
                    executablePath: outputBinaryPath,
                    compileError: false
                });
            });
        });
    });
};

module.exports = executeCpp;