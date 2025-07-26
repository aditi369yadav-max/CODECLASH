const generateFile = require("../utils/generateFile");
const generateInputFile = require("../utils/generateInputFile");
const cleanupFiles = require("../utils/cleanup");

// Keep these imports for the executeCode wrapper
const executeCpp = require("../utils/executeCpp");
const executeC = require("../utils/executeC");
const executeJava = require("../utils/executeJava");
const executePython = require("../utils/executePython");

const cleanInputString = (inputStr) => {
    return String(inputStr || "").trim();
};

const cleanExecutionOutput = (rawOutput) => {
    if (!rawOutput) return "";
    let processedOutput = rawOutput.replace(/\r\n/g, '\n');
    const lines = processedOutput.split('\n');
    const cleanedLines = lines.filter(line => {
        const trimmedLine = line.trim();
        // Filter out common debugging/prompt lines that might appear in some environments
        return !/input:/i.test(trimmedLine) && !/output:/i.test(trimmedLine) && trimmedLine !== 'Press any key to continue...';
    });
    return cleanedLines.join('\n').trim();
};

// New wrapper function to call the correct language executor
const executeCode = async (language, codePath, inputPath, timeLimit = 5, memoryLimit = 256) => {
    console.log(`[${new Date().toISOString()}] executeCode: Preparing to execute for language: ${language}, codePath: ${codePath}, inputPath: ${inputPath || 'N/A'}`);
    switch (language) {
        case "cpp":
            return await executeCpp(codePath, inputPath, timeLimit, memoryLimit);
        case "python":
            return await executePython(codePath, inputPath, timeLimit, memoryLimit);
        case "c":
            return await executeC(codePath, inputPath, timeLimit, memoryLimit);
        case "java":
            return await executeJava(codePath, inputPath, timeLimit, memoryLimit);
        default:
            console.error(`[${new Date().toISOString()}] executeCode: Unsupported language: ${language}`);
            throw new Error(`Unsupported language for execution: ${language}`);
    }
}


const runCode = async (req, res) => {
    const { language = "cpp", code, input: customInput = "", problemId, isCustomRun = false } = req.body;

    console.log(`[${new Date().toISOString()}] runCode: Request received. Language: ${language}, ProblemId: ${problemId || 'None'}, isCustomRun: ${isCustomRun}, Custom Input Provided: ${!!customInput}`);

    if (!code) {
        console.warn(`[${new Date().toISOString()}] runCode: Empty code received.`);
        return res.status(400).json({ error: "❌ Empty code!" });
    }

    let codePath;
    let executablePath = null; // To store path to compiled executable for cleanup
    let overallVerdict = "Pending"; // Start with a neutral verdict
    const testCaseResults = [];
    let finalOutput = "";
    let problemDetails = null;

    try {
        codePath = await generateFile(language, code);
        console.log(`[${new Date().toISOString()}] runCode: Code file generated at: ${codePath}`);

        // --- Handle custom run FIRST if requested ---
        if (isCustomRun) {
            console.log(`[${new Date().toISOString()}] runCode: Initiating custom run execution path.`);
            let inputPath = null;
            if (customInput) {
                const cleanedCustomInput = cleanInputString(customInput);
                inputPath = await generateInputFile(cleanedCustomInput);
                console.log(`[${new Date().toISOString()}] runCode: Custom input file generated at: ${inputPath}`);
            } else {
                console.log(`[${new Date().toISOString()}] runCode: No custom input provided. Executor will receive an empty stream.`);
            }

            console.log(`[${new Date().toISOString()}] runCode: Calling executeCode for custom run...`);
            const executionResult = await executeCode(language, codePath, inputPath);
            console.log(`[${new Date().toISOString()}] runCode: Received execution result from executeCode for custom run:`, executionResult);
            executablePath = executionResult.outputPath; // Capture for cleanup

            finalOutput = cleanExecutionOutput(executionResult.output) || executionResult.error || "No output or error.";

            if (executionResult.compileError) {
                overallVerdict = "Compilation Error";
                finalOutput = executionResult.error; // Show compile error message
                console.error(`[${new Date().toISOString()}] runCode: Custom run resulted in Compilation Error.`);
            } else if (executionResult.error) {
                overallVerdict = "Runtime Error";
                console.error(`[${new Date().toISOString()}] runCode: Custom run resulted in Runtime Error:`, executionResult.error);
            } else if (executionResult.timeExceeded) {
                overallVerdict = "Time Limit Exceeded";
                console.warn(`[${new Date().toISOString()}] runCode: Custom run resulted in Time Limit Exceeded.`);
            } else if (executionResult.memoryExceeded) {
                overallVerdict = "Memory Limit Exceeded";
                console.warn(`[${new Date().toISOString()}] runCode: Custom run resulted in Memory Limit Exceeded.`);
            } else {
                overallVerdict = "Executed"; // Neutral status for successful custom runs
                console.log(`[${new Date().toISOString()}] runCode: Custom run executed successfully.`);
            }

            testCaseResults.push({ // Add this as a single 'test case' result for consistency in frontend display
                input: customInput,
                expectedOutput: "N/A", // No expected output for custom runs
                actualOutput: finalOutput,
                status: overallVerdict, // Use the specific verdict or 'Executed'
                time: executionResult.time,
                memory: executionResult.memory,
                isHidden: false // Always visible
            });

            // Cleanup input file immediately after custom run execution
            if (inputPath) {
                await cleanupFiles(null, inputPath, null);
                console.log(`[${new Date().toISOString()}] runCode: Cleaned up custom input file: ${inputPath}`);
            }
            
            // IMPORTANT: DO NOT return res.json() here. Let the finally block handle it.
            // This prevents the ERR_HTTP_HEADERS_SENT.
            // The execution will fall through to finally and send the response there.

        } else { // --- JUDGING logic (only proceeds if isCustomRun is false) ---
            console.log(`[${new Date().toISOString()}] runCode: Initiating judging path (isCustomRun is false).`);
            overallVerdict = "Accepted"; // Reset for actual problem judging

            if (problemId) {
                console.log(`[${new Date().toISOString()}] runCode: Fetching problem details for ID: ${problemId} from main backend.`);
                const problemApiUrl = `http://host.docker.internal:5000/api/problems/${problemId}`;
                let problemRes;
                try {
                    problemRes = await fetch(problemApiUrl);
                } catch (fetchErr) {
                    console.error(`[${new Date().toISOString()}] runCode: Failed to fetch problem details from ${problemApiUrl}:`, fetchErr);
                    throw new Error(`Backend Connection Error: Could not reach problem service. (${fetchErr.message})`);
                }
                
                if (!problemRes.ok) {
                    throw new Error(`Failed to fetch problem details: ${problemRes.status} ${problemRes.statusText}`);
                }
                problemDetails = await problemRes.json();
                console.log(`[${new Date().toISOString()}] runCode: Problem details fetched successfully.`);

                if (!problemDetails || !problemDetails.testCases || problemDetails.testCases.length === 0) {
                    console.warn(`[${new Date().toISOString()}] runCode: Problem ${problemId} has no test cases. Handling as standalone run.`);
                    // If no test cases for the problem, treat like a custom run using provided customInput
                    if (customInput) {
                        const cleanedCustomInput = cleanInputString(customInput);
                        const inputPath = await generateInputFile(cleanedCustomInput);
                        console.log(`[${new Date().toISOString()}] runCode: No official test cases, running with provided custom input.`);

                        // Use problem details' limits if available, otherwise defaults
                        let executionResult = await executeCode(language, codePath, inputPath, problemDetails.timeLimit, problemDetails.memoryLimit);
                        executablePath = executionResult.outputPath; // Capture for cleanup
                        
                        const cleanedActualOutput = cleanExecutionOutput(executionResult.output);
                        finalOutput = cleanedActualOutput || executionResult.error || "No output generated.";

                        if (executionResult.compileError) {
                            overallVerdict = "Compilation Error";
                            finalOutput = executionResult.error;
                        } else if (executionResult.error) {
                            overallVerdict = "Runtime Error";
                        } else if (executionResult.timeExceeded) {
                            overallVerdict = "Time Limit Exceeded";
                        } else if (executionResult.memoryExceeded) {
                            overallVerdict = "Memory Limit Exceeded";
                        } else {
                            overallVerdict = "Executed (No Official Tests)"; // Neutral status
                        }

                        testCaseResults.push({
                            input: customInput,
                            expectedOutput: "N/A",
                            actualOutput: finalOutput,
                            status: overallVerdict,
                            time: executionResult.time,
                            memory: executionResult.memory,
                            isHidden: false
                        });

                        // Cleanup input file immediately after this execution
                        await cleanupFiles(null, inputPath, null); // outputPath here refers to the input file, not executable.
                        console.log(`[${new Date().toISOString()}] runCode: Cleaned up custom input file (no official tests): ${inputPath}`);

                        // IMPORTANT: DO NOT return res.json() here either.
                        // The execution will fall through to finally and send the response there.
                    } else {
                        overallVerdict = "No Test Cases & No Custom Input";
                        console.log(`[${new Date().toISOString()}] runCode: No test cases and no custom input provided for problem ${problemId}.`);
                        finalOutput = "No test cases provided for this problem and no custom input to run.";
                        // IMPORTANT: DO NOT return res.json() here.
                    }
                } else { // Proceed with official test cases
                    // Loop through all test cases for judging
                    console.log(`[${new Date().toISOString()}] runCode: Processing ${problemDetails.testCases.length} official test cases.`);
                    for (const testCase of problemDetails.testCases) {
                        const cleanedTestCaseInput = cleanInputString(testCase.input);
                        const inputPath = await generateInputFile(cleanedTestCaseInput);
                        
                        let executionResult = { output: '', error: '', time: 'N/A', memory: 'N/A', timeExceeded: false, memoryExceeded: false, outputPath: '', compileError: false };
                        let currentTestCaseVerdict = "Accepted";
                        let actualOutput = "";

                        try {
                            console.log(`[${new Date().toISOString()}] runCode: Calling executeCode for test case with inputPath: ${inputPath}`);
                            executionResult = await executeCode(language, codePath, inputPath, problemDetails.timeLimit, problemDetails.memoryLimit);
                            executablePath = executionResult.outputPath; // Capture for cleanup

                            actualOutput = cleanExecutionOutput(executionResult.output);
                            const expectedOutput = String(testCase.expectedOutput || '').trim(); 

                            console.log(`\n[${new Date().toISOString()}] --- Processing Test Case for Input: "${testCase.input.substring(0, Math.min(50, testCase.input.length))}" ---`);
                            console.log(`[${new Date().toISOString()}] Cleaned Input to program (written to file): "${cleanedTestCaseInput.substring(0, Math.min(50, cleanedTestCaseInput.length))}"`);
                            console.log(`[${new Date().toISOString()}] Raw Program Output (from child_process.exec): "${executionResult.output.substring(0, Math.min(50, executionResult.output.length))}"`);
                            console.log(`[${new Date().toISOString()}] Cleaned Program Output (used for comparison): "${actualOutput.substring(0, Math.min(50, actualOutput.length))}"`);
                            console.log(`[${new Date().toISOString()}] Expected Output (from database, trimmed): "${expectedOutput.substring(0, Math.min(50, expectedOutput.length))}"`);
                            console.log(`[${new Date().toISOString()}] Are they equal? ${actualOutput === expectedOutput}`);
                            console.log(`[${new Date().toISOString()}] Execution Error (if any): "${executionResult.error}"`);
                            console.log(`[${new Date().toISOString()}] Compile Error Flag: ${executionResult.compileError}`);
                            console.log(`[${new Date().toISOString()}] Time Exceeded Flag: ${executionResult.timeExceeded}`);
                            console.log(`[${new Date().toISOString()}] Memory Exceeded Flag: ${executionResult.memoryExceeded}`);


                            if (executionResult.compileError) {
                                currentTestCaseVerdict = "Compilation Error";
                                if (overallVerdict === "Accepted") overallVerdict = "Compilation Error";
                            } else if (executionResult.error) {
                                currentTestCaseVerdict = "Runtime Error";
                                // If current overallVerdict is less severe (e.g., Accepted, WA), upgrade to Runtime Error
                                if (overallVerdict === "Accepted" || overallVerdict === "Wrong Answer") overallVerdict = "Runtime Error";
                            } else if (executionResult.timeExceeded) {
                                currentTestCaseVerdict = "Time Limit Exceeded";
                                // Time Limit takes precedence over WA/Accepted
                                if (overallVerdict === "Accepted" || overallVerdict === "Wrong Answer") overallVerdict = "Time Limit Exceeded";
                            } else if (executionResult.memoryExceeded) {
                                currentTestCaseVerdict = "Memory Limit Exceeded";
                                // Memory Limit takes precedence over others except more severe errors
                                if (overallVerdict === "Accepted" || overallVerdict === "Wrong Answer" || overallVerdict === "Time Limit Exceeded") {
                                    overallVerdict = "Memory Limit Exceeded";
                                }
                            } else if (actualOutput !== expectedOutput) {
                                currentTestCaseVerdict = "Wrong Answer";
                                if (overallVerdict === "Accepted") overallVerdict = "Wrong Answer";
                            } else {
                                currentTestCaseVerdict = "Accepted";
                            }
                        } catch (execErr) {
                            console.error(`[${new Date().toISOString()}] runCode: Error executing test case for problem ${problemId}:`, execErr);
                            currentTestCaseVerdict = "Internal Error";
                            if (overallVerdict === "Accepted" || overallVerdict === "Wrong Answer") overallVerdict = "Internal Error";
                            finalOutput = execErr.message || "An internal error occurred during test case execution.";
                        } finally {
                            testCaseResults.push({
                                input: testCase.input,
                                expectedOutput: testCase.expectedOutput,
                                actualOutput: actualOutput,
                                status: currentTestCaseVerdict,
                                time: executionResult.time,
                                memory: executionResult.memory,
                                isHidden: testCase.isHidden
                            });
                            await cleanupFiles(null, inputPath, executionResult.outputPath); // Clean up input and executable for each test case
                            console.log(`[${new Date().toISOString()}] runCode: Cleaned up input and executable for test case: ${inputPath}, ${executionResult.outputPath}`);
                        }
                    } // End of test case loop

                    // If overallVerdict is Accepted and a custom input was provided during judging (as an additional run),
                    // this block runs it and appends to testCaseResults, but doesn't change overallVerdict.
                    if (overallVerdict === "Accepted" && customInput) {
                        console.log(`[${new Date().toISOString()}] runCode: All official test cases passed. Running custom input for display purposes.`);
                        const cleanedCustomInput = cleanInputString(customInput);
                        const inputPath = await generateInputFile(cleanedCustomInput);
                        const executionResult = await executeCode(language, codePath, inputPath, problemDetails.timeLimit, problemDetails.memoryLimit);
                        executablePath = executionResult.outputPath; // Capture for cleanup
                        finalOutput = cleanExecutionOutput(executionResult.output) || executionResult.error;
                        
                        let customInputStatus = executionResult.error ? "Runtime Error (Custom)" : (executionResult.timeExceeded ? "Time Limit Exceeded (Custom)" : (executionResult.memoryExceeded ? "Memory Limit Exceeded (Custom)" : (executionResult.compileError ? "Compilation Error (Custom)" : "Executed (Custom)")));

                        testCaseResults.push({
                            input: customInput,
                            expectedOutput: "N/A",
                            actualOutput: finalOutput,
                            status: customInputStatus,
                            time: executionResult.time,
                            memory: executionResult.memory,
                            isHidden: false // Always visible
                        });
                        await cleanupFiles(null, inputPath, executionResult.outputPath);
                        console.log(`[${new Date().toISOString()}] runCode: Cleaned up custom input and executable (after official tests): ${inputPath}, ${executionResult.outputPath}`);
                    } else if (!customInput && problemDetails.testCases.length > 0) {
                        // If no custom input and there were official test cases, use the output of the first non-hidden one for main 'output' field
                        const firstNonHiddenTestCaseResult = testCaseResults.find(tc => !tc.isHidden);
                        if (firstNonHiddenTestCaseResult) {
                            finalOutput = cleanExecutionOutput(firstNonHiddenTestCaseResult.actualOutput);
                        } else if (testCaseResults.length > 0) {
                            // Fallback to first test case if all are hidden
                            finalOutput = cleanExecutionOutput(testCaseResults[0].actualOutput);
                        }
                    }
                }
            } else { // No problemId (this path is for the general editor's "Run" button without a problem selected, and isCustomRun is false -- this case might be redundant if isCustomRun handles all standalone runs)
                console.warn(`[${new Date().toISOString()}] runCode: Request received with no problemId and isCustomRun=false. Defaulting to custom input processing if input provided.`);
                // This block is essentially a fallback, should ideally be covered by isCustomRun = true
                if (customInput) {
                    let inputPath = await generateInputFile(cleanInputString(customInput));
                    let executionResult = await executeCode(language, codePath, inputPath);
                    executablePath = executionResult.outputPath; // Capture for cleanup
                    
                    finalOutput = cleanExecutionOutput(executionResult.output) || executionResult.error || "No output generated.";
                    
                    if (executionResult.compileError) {
                        overallVerdict = "Compilation Error";
                        finalOutput = executionResult.error;
                    } else if (executionResult.error) {
                        overallVerdict = "Runtime Error";
                    } else if (executionResult.timeExceeded) {
                        overallVerdict = "Time Limit Exceeded";
                    } else if (executionResult.memoryExceeded) {
                        overallVerdict = "Memory Limit Exceeded";
                    } else {
                        overallVerdict = "Executed";
                    }

                    testCaseResults.push({
                        input: customInput,
                        expectedOutput: "N/A",
                        actualOutput: finalOutput,
                        status: overallVerdict,
                        time: executionResult.time,
                        memory: executionResult.memory,
                        isHidden: false
                    });
                    await cleanupFiles(null, inputPath, null); // Clean up input file after execution
                    console.log(`[${new Date().toISOString()}] runCode: Cleaned up custom input file (no problemId, isCustomRun=false path): ${inputPath}`);

                } else {
                    overallVerdict = "No Custom Input (Standalone)";
                    finalOutput = "No custom input provided for standalone run without a problem ID.";
                }
            }
        } // End of if (!isCustomRun) / Judging logic
    } catch (err) {
        console.error(`[${new Date().toISOString()}] runCode: ❌ Caught an overall compiler/server error:`, err);
        overallVerdict = "Server Error";
        finalOutput = err?.message || "Internal server error during judging/compilation.";
        
        // Ensure testCaseResults is not empty, even with an overall error
        if (testCaseResults.length === 0) {
            testCaseResults.push({
                input: "N/A", expectedOutput: "N/A", actualOutput: finalOutput,
                status: overallVerdict, time: "N/A", memory: "N/A", isHidden: false
            });
        }
    } finally {
        console.log(`[${new Date().toISOString()}] runCode: Finalizing cleanup. Code path: ${codePath || 'N/A'}, Executable path: ${executablePath || 'N/A'}`);
        // Ensure cleanup only happens if codePath exists (meaning generateFile succeeded)
        if (codePath) {
            await cleanupFiles(codePath, null, executablePath); // Clean up code file and the final executable
            console.log(`[${new Date().toISOString()}] runCode: Cleanup complete.`);
        } else {
            console.warn(`[${new Date().toISOString()}] runCode: No codePath generated, skipping file cleanup.`);
        }


        // Ensure output is set even if all test cases fail
        if (!finalOutput && testCaseResults.length > 0 && testCaseResults[0].actualOutput) {
            finalOutput = testCaseResults[0].actualOutput;
        } else if (!finalOutput && overallVerdict !== "Accepted") {
            finalOutput = "An error occurred. Check verdict and debug log.";
        } else if (!finalOutput && testCaseResults.length === 0) {
            finalOutput = "No output or test case results available.";
        }

        // ONE SINGLE res.json() call here
        res.json({
            overallVerdict,
            output: finalOutput, // Ensure finalOutput is set
            testCaseResults
        });
        console.log(`[${new Date().toISOString()}] runCode: Response sent. Overall Verdict: ${overallVerdict}, Output Length: ${finalOutput.length}, Test Cases: ${testCaseResults.length}`);
    }
};

module.exports = { runCode };