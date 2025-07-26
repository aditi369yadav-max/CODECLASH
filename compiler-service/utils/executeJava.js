// compiler-service/utils/executeJava.js
const { exec, spawn } = require("child_process");
const path = require("path");
const fs = require("fs-extra");

const outputPath = path.join(__dirname, "../outputs"); // Directory for compiled .class files

fs.ensureDirSync(outputPath);

const executeJava = (codePath, inputPath, timeLimit = 5, memoryLimit = 256) => {
    return new Promise(async (resolve) => { // Made it async to use await for cleanup
        console.log(`[${new Date().toISOString()}] executeJava: Starting for codePath: ${codePath}, inputPath: ${inputPath}`);

        const jobId = path.basename(codePath).split('.')[0];
        const className = "Main"; // Assuming the public class is always Main as per boilerplate
        const outputDir = path.join(outputPath, jobId); // Create a unique directory for each Java run's classes
        const classFilePath = path.join(outputDir, `${className}.class`);

        let runStdout = '';
        let runStderr = '';
        let executionTimeMs = "N/A";
        let verdict = "Accepted";
        let timeExceeded = false;
        let memoryExceeded = false;
        let errorOutput = null;
        let compileError = false;

        try {
            // Ensure the specific output directory exists for this run
            await fs.ensureDir(outputDir);
            console.log(`[${new Date().toISOString()}] executeJava: Created output directory: ${outputDir}`);

            // Step 1: Compile the Java code
            // The -d flag specifies where to place the generated .class files
            const compileCommand = `javac ${codePath} -d ${outputDir}`;
            console.log(`[${new Date().toISOString()}] executeJava: Compile command: ${compileCommand}`);

            const { stderr: compileStderr } = await new Promise((resExec) => {
                exec(compileCommand, (err, stdout, stderr) => {
                    resExec({ err, stdout, stderr });
                });
            });

            if (compileStderr) {
                console.error(`[${new Date().toISOString()}] executeJava: Compilation failed for ${codePath}: ${compileStderr}`);
                compileError = true;
                verdict = "Compilation Error";
                errorOutput = compileStderr;
                return resolve({
                    output: "",
                    error: errorOutput,
                    verdict: verdict,
                    timeExceeded: false,
                    memoryExceeded: false,
                    time: "0.00 ms",
                    memory: "N/A",
                    executablePath: null,
                    compileError: compileError
                });
            }
            console.log(`[${new Date().toISOString()}] executeJava: Compilation successful for ${codePath}`);

            // Step 2: Execute the compiled Java code
            // -classpath or -cp tells Java where to look for .class files
            const executeCommand = `java -cp ${outputDir} ${className}`;
            console.log(`[${new Date().toISOString()}] executeJava: Execute command: ${executeCommand}`);

            const startTime = process.hrtime.bigint();
            const child = spawn('java', ['-cp', outputDir, className], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            // Conditional Input Stream handling
            if (inputPath && fs.existsSync(inputPath)) {
                const inputStream = fs.createReadStream(inputPath);
                inputStream.on('error', (err) => {
                    console.error(`[${new Date().toISOString()}] executeJava: Input stream error for ${inputPath}: ${err.message}`);
                });
                inputStream.pipe(child.stdin);
                console.log(`[${new Date().toISOString()}] executeJava: Input stream piped to child.stdin from ${inputPath}`);
            } else {
                child.stdin.end(); // No input to provide, so close stdin
                console.log(`[${new Date().toISOString()}] executeJava: No valid input path provided. Child stdin closed immediately.`);
            }

            const timeout = setTimeout(() => {
                console.warn(`[${new Date().toISOString()}] executeJava: Timeout reached for ${className}. Killing process.`);
                child.kill('SIGTERM');
                timeExceeded = true;
                verdict = "Time Limit Exceeded";
                errorOutput = `Execution timed out after ${timeLimit} seconds.`;
            }, timeLimit * 1000);

            child.stdout.on('data', (data) => {
                runStdout += data.toString();
                console.log(`[${new Date().toISOString()}] executeJava: stdout data received: ${data.toString().trim()}`);
            });

            child.stderr.on('data', (data) => {
                runStderr += data.toString();
                console.log(`[${new Date().toISOString()}] executeJava: stderr data received: ${data.toString().trim()}`);
            });

            child.on('close', async (code) => { // Made it async for cleanup
                clearTimeout(timeout);
                const endTime = process.hrtime.bigint();
                executionTimeMs = (Number(endTime - startTime) / 1_000_000).toFixed(2);
                console.log(`[${new Date().toISOString()}] executeJava: Child process closed with code ${code}. Execution time: ${executionTimeMs} ms`);

                if (timeExceeded) {
                    // Verdict already set by timeout handler
                } else if (code !== 0) {
                    verdict = "Runtime Error";
                    errorOutput = runStderr || `Process exited with code ${code}.`;
                } else if (runStderr) {
                    verdict = "Runtime Error";
                    errorOutput = runStderr;
                }

                // Cleanup (moved to finally block in the controller for consistency and robust cleanup)
                // await fs.remove(outputDir); // Clean up the directory containing .class files
                // await fs.remove(codePath); // Clean up the source .java file

                resolve({
                    output: runStdout,
                    error: errorOutput,
                    verdict: verdict,
                    timeExceeded: timeExceeded,
                    memoryExceeded: memoryExceeded,
                    time: `${executionTimeMs} ms`,
                    memory: "N/A",
                    executablePath: classFilePath, // Path to the compiled .class file (or directory)
                    compileError: compileError
                });
            });

            child.on('error', async (err) => { // Made it async for cleanup
                clearTimeout(timeout);
                console.error(`[${new Date().toISOString()}] executeJava: Child process error (spawn failed): ${err.message}`);
                verdict = "Internal Error";
                errorOutput = `Failed to start process: ${err.message}`;

                // Cleanup (moved to finally block in the controller)
                // await fs.remove(outputDir);
                // await fs.remove(codePath);

                resolve({
                    output: "",
                    error: errorOutput,
                    verdict: verdict,
                    timeExceeded: false,
                    memoryExceeded: false,
                    time: "N/A",
                    memory: "N/A",
                    executablePath: null,
                    compileError: compileError
                });
            });

        } catch (err) {
            console.error(`[${new Date().toISOString()}] executeJava: Unexpected error during execution: ${err.message}`);
            resolve({
                output: "",
                error: `Server Error: ${err.message}`,
                verdict: "Server Error",
                timeExceeded: false,
                memoryExceeded: false,
                time: "N/A",
                memory: "N/A",
                executablePath: null,
                compileError: true // Treat as compile error if it crashes before execution
            });
        } finally {
            // Cleanup will be handled by the controller's finally block
            // This ensures cleanup happens even if the promise resolves early due to an error.
        }
    });
};

module.exports = executeJava;