'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Editor from '@monaco-editor/react';
import Link from 'next/link';
import Image from 'next/image'; // Import the Image component
import homeStyles from '../../../home.module.css'; // Adjust path for homeStyles
import styles from './problem-detail.module.css';

// Import the AI code review API utility
// Make sure this path is correct based on your project structure
import { getAiCodeReview } from '../../../../utils/api';

// Define a more comprehensive Problem interface based on the backend schema and frontend needs
interface Problem {
    _id: string;
    title: string;
    code: string; // Problem ID/number (e.g., P101)
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    timeLimit: number; // In seconds
    memoryLimit?: number; // In MB
    inputFormat?: string;
    outputFormat?: string;
    constraints?: string[]; // Array of constraint strings
    testCases: Array<{ // Matches backend schema
        input: string;
        expectedOutput: string;
        isHidden: boolean;
        // Add optional explanation for example test cases if your backend supports it
        explanation?: string;
    }>;
    initialCode?: { [key: string]: string }; // Optional initial code templates per language
    tags: string[];
    acceptanceRate?: string;
    totalAttempts?: string;
}

// Interface for detailed test case results from compiler service
interface TestCaseResult {
    input: string;
    expectedOutput: string;
    actualOutput: string;
    status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error' | 'Memory Limit Exceeded' | 'No Custom Input' | 'Time Limit Exceeded (Custom Run)' | 'Memory Limit Exceeded (Custom Run)' | 'No Test Cases & No Custom Input'; // Added Custom Run specific statuses
    time: string; // e.g., "12.34 ms"
    memory?: string; // If your backend ever returns this, e.g., "10.5 MB"
    isHidden: boolean; // Indicates if it's a hidden test case (for submissions) or a sample/custom
}

// Mock initial code templates (can be fetched from backend later)
const initialCodeTemplates: { [key: string]: string } = {
    cpp: `#include <iostream>

int main() {
    // Write your C++ code here
    std::cout << "Hello C++" << std::endl;
    return 0;
}`,
    c: `#include <stdio.h>

int main() {
    // Write your C code here
    printf("Hello C\\n");
    return 0;
}`,
    python: `# Write your Python code here
def solve():
    pass

solve()`,
    java: `public class Main {
    public static void main(String[] args) {
        // Write your Java code here
        System.out.println("Hello Java");
    }
}`,
};


export default function ProblemPage() {
    const { id } = useParams();
    const [problem, setProblem] = useState<Problem | null>(null);
    const [language, setLanguage] = useState('cpp');
    const [code, setCode] = useState(initialCodeTemplates['cpp']);
    const [customInput, setCustomInput] = useState('');
    const [output, setOutput] = useState(''); // Stores output for 'Output' tab
    const [resultsTab, setResultsTab] = useState('Output');
    const [overallVerdict, setOverallVerdict] = useState(''); // Stores overall verdict
    const [judgingResults, setJudgingResults] = useState<TestCaseResult[]>([]); // Stores detailed test case results
    const [loading, setLoading] = useState(false); // For compilation/run/submit
    const [isDarkTheme, setIsDarkTheme] = useState(true); // You can use a context/global state for theme
    const [showScrollToTop, setShowScrollToTop] = useState(false);
    const problemPanelRef = useRef<HTMLDivElement>(null);

    // AI Feedback States
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    // Example submission history (mock data, will be updated by actual submissions)
    const [submissionHistory, setSubmissionHistory] = useState([
        { id: 1, timestamp: '2025-07-10 14:30', language: 'cpp', status: 'Accepted' },
        { id: 2, timestamp: '2025-07-10 14:25', language: 'python', status: 'Wrong Answer' },
        { id: 3, timestamp: '2025-07-09 10:00', language: 'java', status: 'Time Limit Exceeded' },
    ]);

    // Fetch problem data
    useEffect(() => {
        const fetchProblemData = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/problems/${id}`);
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const data: Problem = await res.json();
                setProblem(data);

                // Set initial code based on fetched problem's initialCode or fallback templates
                const initialCode = data.initialCode?.[language] || initialCodeTemplates[language] || '// Start coding here...';
                setCode(initialCode);
                // Default custom input from first non-hidden test case
                setCustomInput(data.testCases.find(tc => !tc.isHidden)?.input || '');
            } catch (err) {
                console.error("Failed to fetch problem:", err);
                setProblem(null);
            }
        };

        if (id) {
            fetchProblemData();
        }
    }, [id, language]); // Added language to dependency array to re-fetch template on language change if problem.initialCode exists

    // Update code template when language changes
    useEffect(() => {
        if (problem) {
            // Prioritize problem's initialCode for the selected language, then local templates, then generic placeholder
            const newTemplate = problem.initialCode?.[language] || initialCodeTemplates[language] || '// Start coding here...';
            setCode(newTemplate);
        }
    }, [language, problem]); // Re-run when language or problem object changes

    // Helper to reset verdicts and output before a new run/submit
    const resetExecutionState = () => {
        setOverallVerdict('');
        setOutput('');
        setJudgingResults([]);
        setAiFeedback(null); // Clear AI feedback on new execution
        setAiError(null);
    };

    // Handle Run Code
    const handleRun = async () => {
        setLoading(true);
        resetExecutionState();
        setResultsTab('Output'); // Always go to output tab for run

        try {
            const res = await fetch('http://localhost:8000/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language,
                    code,
                    input: customInput, // Send custom input for 'Run'
                    problemId: problem?._id, // Still send problem ID for context/limits in backend, but isCustomRun flag will dominate
                    isCustomRun: true, // <--- ADDED THIS FLAG!
                }),
            });
            const data = await res.json(); // This data now contains overallVerdict, output, testCaseResults

            if (data.error) {
                // If there's a top-level error from the compiler service (e.g., internal error)
                setOutput(`Error: ${data.error}`);
                setOverallVerdict('❌ Service Error');
                setJudgingResults([]); // Clear any previous results
            } else {
                // For 'Run with Custom Input', the backend should now return a single result
                // in testCaseResults array, or directly in 'output' and 'overallVerdict'.
                setOverallVerdict(data.overallVerdict || 'Unknown Verdict');
                setOutput(data.output || 'No output captured.'); // Direct output from custom run

                // If testCaseResults is provided and has items (as expected for custom run now)
                if (data.testCaseResults && data.testCaseResults.length > 0) {
                    setJudgingResults(data.testCaseResults); // Will contain the single custom run result
                } else {
                    setJudgingResults([]); // Ensure it's clear if no results came back unexpectedly
                }
            }

        } catch (err) {
            console.error("Error during run:", err);
            setOutput('❌ Error while running');
            setOverallVerdict('❌ Internal Error');
            setJudgingResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle Submit Code
    const handleSubmit = async () => {
        setLoading(true);
        resetExecutionState(); // Clear previous results
        setResultsTab('Test Cases'); // Always go to Test Cases tab for submit

        try {
            // For submission, we'd typically run against ALL test cases (including hidden ones)
            // The compiler service handles this when problemId is sent.
            const res = await fetch('http://localhost:8000/run', { // Re-using run endpoint for simplicity and full judging
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language,
                    code,
                    problemId: problem?._id, // Send problem ID for full judging against all test cases
                    // isCustomRun: false, // Not needed, as default is false on backend
                    // No customInput for submission, as it runs against predefined tests
                }),
            });
            const data = await res.json();

            let submissionStatus = data.overallVerdict || 'Unknown';
            if (data.error) {
                submissionStatus = 'Submission Error';
                setOutput(`Error: ${data.error}`); // Output for debugging service errors
                setJudgingResults([]);
            } else {
                setOutput(data.output || 'No specific output for overall submission.'); // General output, actual test outputs are in judgingResults
                setJudgingResults(data.testCaseResults || []); // Store detailed test case results for judging
            }

            // Update submission history with actual verdict
            const newSubmission = {
                id: submissionHistory.length + 1,
                timestamp: new Date().toLocaleString(),
                language,
                status: submissionStatus,
            };
            setSubmissionHistory(prev => [newSubmission, ...prev]);
            setOverallVerdict(submissionStatus); // Set overall verdict from backend

        } catch (err) {
            console.error("Error during submission:", err);
            setOverallVerdict('❌ Submission Failed');
            setOutput('❌ Error during submission process.');
            setJudgingResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle Reset Code
    const handleResetCode = () => {
        if (problem) {
            const initialCode = problem.initialCode?.[language] || initialCodeTemplates[language] || '// Start coding here...';
            setCode(initialCode);
        }
    };

    // Handle Get AI Code Review
    const handleReviewCode = async () => {
        setIsAiLoading(true);
        setAiError(null);
        setAiFeedback(null); // Clear previous feedback
        setResultsTab('AI Feedback'); // Switch to AI Feedback tab

        try {
            const response = await getAiCodeReview(code, language); // Call returns AiReviewResponse

            if (response.success && response.aiFeedback) {
                setAiFeedback(response.aiFeedback); // Access the aiFeedback property
            } else {
                // If success is false or aiFeedback is missing
                setAiError(response.error || 'AI review failed without a specific error message.');
                setAiFeedback(null); // Ensure no old feedback is displayed
            }
        } catch (err) {
            console.error("Error fetching AI code review:", err);
            // This catch block handles network errors or errors thrown by getAiCodeReview itself
            setAiError(`Failed to get AI code review: ${err instanceof Error ? err.message : String(err)}`);
            setAiFeedback(null); // Ensure feedback is null on error
        } finally {
            setIsAiLoading(false);
        }
    };

    // Scroll-to-top logic
    useEffect(() => {
        const handleScroll = () => {
            if (problemPanelRef.current) {
                setShowScrollToTop(problemPanelRef.current.scrollTop > 200);
            }
        };

        const currentRef = problemPanelRef.current;
        if (currentRef) {
            currentRef.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (currentRef) {
                currentRef.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    const scrollToTop = () => {
        if (problemPanelRef.current) {
            problemPanelRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getDifficultyColorClass = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return styles.difficultyEasy;
            case 'medium': return styles.difficultyMedium;
            case 'hard': return styles.difficultyHard;
            default: return '';
        }
    };

    if (!problem) {
        return (
            <div className={`${styles.problemPageContainer} ${isDarkTheme ? homeStyles.darkTheme : homeStyles.lightTheme}`}>
                {/* Navbar and Footer for loading state to maintain consistency */}
                <nav className={homeStyles.nav}>
                    <Link href="/" className={homeStyles['logo-link']}>
                        <div className={homeStyles['logo-group']}>
                            {/* Replaced <img> with <Image> */}
                            <Image src="/logo.svg" alt="Codeclash Logo" className={homeStyles['logo-icon']} width={32} height={32} />
                            <span className={homeStyles['logo-text']}>CodeClash</span>
                        </div>
                    </Link>
                    <div className={homeStyles['nav-links']}>
                        <Link href="/compiler">Compiler</Link>
                        <Link href="/problems" className={homeStyles.activeNavLink}>Problem</Link>
                        <Link href="/dashboard">Dashboard</Link>
                        <Link href="/login">Login</Link>
                        <Link href="/signup">
                            <button className={homeStyles['btn-primary']}>Sign Up</button>
                        </Link>
                        <button
                            onClick={() => setIsDarkTheme(!isDarkTheme)}
                            className={homeStyles['theme-toggle-btn']}
                        >
                            {isDarkTheme ? '☀️' : '🌙'} {/* Replaced ☀ with ☀️ (full sun emoji) */}
                        </button>
                    </div>
                </nav>
                <main className={styles.loadingState}>
                    <p>Loading problem details...</p>
                </main>
                <footer className={homeStyles.footer}>
                    <div className={homeStyles['footer-content']}>
                        <div className={homeStyles['logo-group']}>
                            {/* Replaced <img> with <Image> */}
                            <Image src="/logo.svg" alt="Codeclash Logo" className={homeStyles['logo-icon']} width={32} height={32} />
                            <span className={homeStyles['logo-text']}>CodeClash</span>
                        </div>
                        <div className={homeStyles['footer-links']}>
                            <Link href="/about">About Us</Link>
                            <Link href="/contact">Contact</Link>
                            <Link href="/privacy">Privacy Policy</Link>
                            <Link href="/terms">Terms of Service</Link>
                        </div>
                        <div className={homeStyles['social-icons']}>
                            <a href="#">G</a>
                            <a href="#">T</a>
                            <a href="#">L</a>
                        </div>
                    </div>
                    <p className={homeStyles.copyright}>
                        © 2025 CODECLASH. All rights reserved.
                    </p>
                </footer>
            </div>
        );
    }

    return (
        <div className={`${styles.problemPageContainer} ${isDarkTheme ? homeStyles.darkTheme : homeStyles.lightTheme}`}>
            {/* Navigation Bar (Header) - Reusing homepage nav structure and styles */}
            <nav className={homeStyles.nav}>
                <Link href="/" className={homeStyles['logo-link']}>
                    <div className={homeStyles['logo-group']}>
                        {/* Replaced <img> with <Image> */}
                        <Image src="/logo.svg" alt="Codeclash Logo" className={homeStyles['logo-icon']} width={32} height={32} />
                        <span className={homeStyles['logo-text']}>CodeClash</span>
                    </div>
                </Link>

                <div className={homeStyles['nav-links']}>
                    <Link href="/editor">Compiler</Link>
                    <Link href="/problems" className={homeStyles.activeNavLink}>Problem</Link> {/* Highlighted */}
                    <Link href="/dashboard">Dashboard</Link>
                    <Link href="/login">Login</Link>
                    <Link href="/signup">
                        <button className={homeStyles['btn-primary']}>Sign Up</button>
                    </Link>
                    <button
                        onClick={() => setIsDarkTheme(!isDarkTheme)}
                        className={homeStyles['theme-toggle-btn']}
                    >
                        {isDarkTheme ? '☀️' : '🌙'} {/* Replaced ☀ with ☀️ (full sun emoji) */}
                    </button>
                </div>
            </nav>

            {/* Main Workspace Area */}
            <main className={styles.mainWorkspaceArea}>
                {/* Problem Details Panel (Left Pane) */}
                <section ref={problemPanelRef} className={styles.problemDetailsPanel}>
                    <div className={styles.problemHeader}>
                        <h1 className={styles.problemTitle}>
                            {problem.code}: {problem.title}
                            <span className={`${styles.difficultyBadge} ${getDifficultyColorClass(problem.difficulty)}`}>
                                {problem.difficulty}
                            </span>
                        </h1>
                        <div className={styles.topicTagsContainer}>
                            {problem.tags && problem.tags.map((tag, index) => (
                                <span key={index} className={styles.tagBadge}>{tag}</span>
                            ))}
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionHeading}>Problem Description</h2>
                        {/* Using dangerouslySetInnerHTML to render description with potential HTML tags (e.g., <code>) */}
                        <div className={styles.problemStatement} dangerouslySetInnerHTML={{ __html: problem.description.replace(/`/g, '<code>') }}></div>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionHeading}>Input Format</h2>
                        {/* Provide fallback text if inputFormat is undefined */}
                        <p className={styles.inputOutputFormat}>{problem.inputFormat || 'Not specified.'}</p>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionHeading}>Output Format</h2>
                        {/* Provide fallback text if outputFormat is undefined */}
                        <p className={styles.inputOutputFormat}>{problem.outputFormat || 'Not specified.'}</p>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionHeading}>Constraints</h2>
                        <ul className={styles.constraintsList}>
                            <li>Time Limit: {problem.timeLimit} Second(s)</li>
                            <li>Memory Limit: {problem.memoryLimit || 256} MB</li> {/* Default memory limit if not provided */}
                            {/* Render constraints from problem.constraints array, or provide fallback */}
                            {problem.constraints && problem.constraints.length > 0 ? (
                                problem.constraints.map((constraint, index) => (
                                    <li key={index}>{constraint}</li>
                                ))
                            ) : (
                                <li>No additional constraints specified.</li>
                            )}
                        </ul>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionHeading}>Examples</h2>
                        {/* Filter out hidden test cases for display as examples */}
                        {problem.testCases && problem.testCases.filter(tc => !tc.isHidden).map((testCase, index) => (
                            <ExampleBlock key={index} example={testCase} index={index + 1} />
                        ))}
                        {(!problem.testCases || problem.testCases.filter(tc => !tc.isHidden).length === 0) && (
                            <p className={styles.noExamplesFound}>No examples provided for this problem.</p>
                        )}
                    </div>

                    {/* Scroll-to-Top Button */}
                    <button
                        className={`${styles.scrollToTopBtn} ${showScrollToTop ? styles.show : ''}`}
                        onClick={scrollToTop}
                        title={"Scroll to top"}
                    >
                        ⬆
                    </button>
                </section>

                {/* Resizer - Visual only, JS needed for actual drag functionality */}
                {/* <div className={styles.resizer}><div className={styles['resizer-handle']}></div></div> */}

                {/* Code Editor Panel (Right Pane) */}
                <section className={styles.codeEditorPanel}>
                    <div className={styles.editorHeader}>
                        <select
                            className={styles.languageSelector}
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option value="cpp">C++</option>
                            <option value="c">C</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                        </select>
                        <div className={styles.editorButtons}>
                            <button onClick={handleResetCode} className={styles.resetButton}>Reset</button>
                            <button className={styles.bookmarkIconBtn} title="Bookmark Problem">⭐</button>
                        </div>
                    </div>
                    <div className={styles.monacoEditorContainer}>
                        <Editor
                            height="100%" // Fill container height
                            language={language}
                            theme="vs-dark" // Dark theme for editor
                            value={code}
                            onChange={(v) => setCode(v || '')}
                            options={{
                                fontSize: 14,
                                minimap: { enabled: false },
                                lineNumbers: 'on',
                                wordWrap: 'on',
                                // Add more options for bracket matching, auto-indentation etc.
                                // You might need to configure Monaco Editor loader for advanced features
                            }}
                        />
                    </div>

                    {/* Output/Test Case Results Panel */}
                    <div className={styles.resultsPanel}>
                        <div className={styles.resultsTabs}>
                            <button
                                className={`${styles.resultsTabButton} ${resultsTab === 'Output' ? styles.active : ''}`}
                                onClick={() => setResultsTab('Output')}
                            >
                                Output
                            </button>
                            <button
                                className={`${styles.resultsTabButton} ${resultsTab === 'Test Cases' ? styles.active : ''}`}
                                onClick={() => setResultsTab('Test Cases')}
                                // Disable Test Cases tab if no problem is loaded (no actual test cases to show)
                                disabled={!problem || (problem.testCases.length === 0 && judgingResults.length === 0)}
                            >
                                Test Cases
                            </button>
                            <button
                                className={`${styles.resultsTabButton} ${resultsTab === 'Submissions' ? styles.active : ''}`}
                                onClick={() => setResultsTab('Submissions')}
                            >
                                Submissions
                            </button>
                            {/* New AI Feedback Tab Button */}
                            <button
                                className={`${styles.resultsTabButton} ${resultsTab === 'AI Feedback' ? styles.active : ''}`}
                                onClick={() => setResultsTab('AI Feedback')}
                            >
                                AI Feedback
                            </button>
                        </div>
                        <div className={styles.tabContent}>
                            {resultsTab === 'Output' && (
                                <>
                                    <h3 className={styles.sectionHeading} style={{ fontSize: '1.2rem', marginBottom: '0.8rem' }}>Custom Input</h3>
                                    <textarea
                                        value={customInput}
                                        onChange={(e) => setCustomInput(e.target.value)}
                                        className={styles.customInputBox}
                                        placeholder="Enter custom input here..."
                                    />
                                    <button onClick={handleRun} className={styles.runCustomTestBtn} disabled={loading}>
                                        {loading ? 'Running...' : 'Run Custom Test'}
                                    </button>

                                    <h3 className={styles.sectionHeading} style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.8rem' }}>Output</h3>
                                    <div className={styles.outputDisplay}>
                                        <pre>{output || 'Your code output will appear here.'}</pre>
                                        {overallVerdict && ( // Use overallVerdict here
                                            <p className={
                                                overallVerdict.includes('Accepted') ? styles.verdictAccepted :
                                                    overallVerdict.includes('Wrong Answer') ? styles.verdictWrongAnswer :
                                                        overallVerdict.includes('Runtime Error') ? styles.verdictRuntimeError :
                                                            overallVerdict.includes('Time Limit Exceeded') ? styles.verdictTimeLimitExceeded :
                                                                overallVerdict.includes('Compilation Error') ? styles.verdictCompilationError :
                                                                    overallVerdict.includes('Memory Limit Exceeded') ? styles.verdictMemoryLimitExceeded :
                                                                        styles.verdictNoOutput // Fallback for other verdicts like 'Service Error'
                                            }>
                                                {overallVerdict}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            {resultsTab === 'Test Cases' && (
                                <ul className={styles.testCaseList}>
                                    {judgingResults.length > 0 ? ( // Display judgingResults if available
                                        judgingResults.map((testCaseResult, index) => (
                                            <TestCaseItem
                                                key={index}
                                                testCase={testCaseResult} // Pass the full testCaseResult
                                                index={index + 1}
                                            />
                                        ))
                                    ) : (
                                        <p className={styles.noExamplesFound}>Run your code or submit to see test case results.</p>
                                    )}
                                </ul>
                            )}

                            {resultsTab === 'Submissions' && (
                                <ul className={styles.submissionHistoryList}>
                                    {submissionHistory.length === 0 ? (
                                        <li className={styles.noProblemsFound}>No submissions yet.</li>
                                    ) : (
                                        submissionHistory.map((submission) => (
                                            <li key={submission.id} className={styles.submissionHistoryItem}>
                                                <div>
                                                    <span className={
                                                        submission.status === 'Accepted' ? styles.statusAccepted :
                                                            submission.status === 'Wrong Answer' ? styles.statusWrongAnswer :
                                                                submission.status.includes('Time Limit Exceeded') ? styles.statusTimeLimit :
                                                                    submission.status.includes('Compilation Error') ? styles.statusCompilationError :
                                                                        submission.status.includes('Runtime Error') ? styles.statusRuntimeError :
                                                                            submission.status.includes('Memory Limit Exceeded') ? styles.statusMemoryLimit :
                                                                                styles.verdictNoOutput // Fallback for other statuses
                                                    }>
                                                        {submission.status}
                                                    </span>
                                                    <span className={styles.language}> ({submission.language})</span>
                                                </div>
                                                <span className={styles.timestamp}>{submission.timestamp}</span>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            )}

                            {/* New AI Feedback Tab Content */}
                            {resultsTab === 'AI Feedback' && (
                                <div className={styles.aiFeedbackSection}>
                                    <h3 className={styles.sectionHeading} style={{ fontSize: '1.2rem', marginBottom: '0.8rem' }}>AI Code Review</h3>
                                    <button onClick={handleReviewCode} className={styles.getAiReviewBtn} disabled={isAiLoading}>
                                        {isAiLoading ? 'Getting Feedback...' : 'Get AI Code Review'}
                                    </button>
                                    {isAiLoading && <p className={styles.aiLoadingMessage}>Generating feedback, please wait...</p>}
                                    {aiError && <p className={styles.aiErrorMessage}>Error: {aiError}</p>}
                                    {aiFeedback && (
                                        <div className={styles.aiFeedbackDisplay}>
                                            <pre>{aiFeedback}</pre>
                                        </div>
                                    )}
                                    {!isAiLoading && !aiError && !aiFeedback && (
                                        <p className={styles.noFeedbackMessage}>Click &quot;Get AI Code Review&quot; to analyze your code.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* Action Bar */}
            <div className={styles.actionBar}>
                <button onClick={handleRun} className={`${styles.actionBarButton} ${styles.runCodeBtn}`} disabled={loading}>
                    {loading ? 'Running...' : 'Run Code'}
                </button>
                <button onClick={handleSubmit} className={`${styles.actionBarButton} ${styles.submitCodeBtn}`} disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit'}
                </button>
            </div>

            {/* Footer - Reusing homepage footer structure and styles */}
            <footer className={homeStyles.footer}>
                <div className={homeStyles['footer-content']}>
                    <div className={homeStyles['logo-group']}>
                        {/* Replaced <img> with <Image> */}
                        <Image src="/logo.svg" alt="Codeclash Logo" className={homeStyles['logo-icon']} width={32} height={32} />
                        <span className={homeStyles['logo-text']}>CodeClash</span>
                    </div>
                    <div className={homeStyles['footer-links']}>
                        <Link href="/about">About Us</Link>
                        <Link href="/contact">Contact</Link>
                        <Link href="/privacy">Privacy Policy</Link>
                        <Link href="/terms">Terms of Service</Link>
                    </div>
                    <div className={homeStyles['social-icons']}>
                        <a href="#">G</a>
                        <a href="#">T</a>
                        <a href="#">L</a>
                    </div>
                </div>
                <p className={homeStyles.copyright}>
                    © 2025 CODECLASH. All rights reserved.
                </p>
            </footer>
        </div>
    );
}

// Helper Component for Collapsible Example Blocks
interface ExampleBlockProps {
    example: {
        input: string;
        expectedOutput: string;
        explanation?: string; // Optional explanation for examples
    };
    index: number;
}

const ExampleBlock: React.FC<ExampleBlockProps> = ({ example, index }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={styles.exampleBlock}>
            <h3 onClick={() => setIsOpen(!isOpen)}>
                Example {index}
                <span className={`${styles['toggle-icon']} ${isOpen ? styles.rotated : ''}`}>▶</span>
            </h3>
            {isOpen && (
                <div className={styles.exampleContent}>
                    <p><b>Input:</b></p>
                    <pre>{example.input}</pre>
                    <p><b>Output:</b></p>
                    <pre>{example.expectedOutput}</pre>
                    {example.explanation && (
                        <>
                            <p><b>Explanation:</b></p>
                            <p>{example.explanation}</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};


// Helper Component for Test Case Items (for Test Cases Tab)
interface TestCaseItemProps {
    testCase: TestCaseResult; // Now directly use the TestCaseResult interface
    index: number;
}

const TestCaseItem: React.FC<TestCaseItemProps> = ({ testCase, index }) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Derive status and icon from testCase.status
    // let displayStatus: 'passed' | 'failed' | 'pending' = 'pending'; // REMOVED: 'displayStatus' is assigned a value but never used.
    let statusIcon = '⏳';
    let statusClass = styles.pending; // Default class

    // Determine status based on backend verdict
    if (testCase.status === 'Accepted') {
        // displayStatus = 'passed'; // REMOVED
        statusIcon = '✅';
        statusClass = styles.passed;
    } else if (
        testCase.status === 'Wrong Answer' ||
        testCase.status.includes('Time Limit Exceeded') || // Catch both general and custom TLE
        testCase.status.includes('Runtime Error') || // Catch both general and custom RTE
        testCase.status === 'Compilation Error' ||
        testCase.status.includes('Memory Limit Exceeded') // Catch both general and custom MLE
    ) {
        // displayStatus = 'failed'; // REMOVED
        statusIcon = '❌';
        statusClass = styles.failed;
    } else if (testCase.status.includes('Custom Run')) {
        // For 'Custom Run', the status from the backend will be the actual verdict
        // e.g., "Accepted (Custom Run)", "Wrong Answer (Custom Run)"
        // So, we'll try to determine the icon/class from the `overallVerdict` string itself.
        // This makes `testCase.status` directly the verdict for custom runs.
        if (testCase.status.includes('Accepted')) {
            // displayStatus = 'passed'; // REMOVED
            statusIcon = '✅';
            statusClass = styles.passed;
        } else if (testCase.status.includes('Wrong Answer') || testCase.status.includes('Error') || testCase.status.includes('Limit Exceeded')) {
            // displayStatus = 'failed'; // REMOVED
            statusIcon = '❌';
            statusClass = styles.failed;
        } else {
            // Fallback for other custom run states if they exist
            statusIcon = 'ℹ️'; // Info icon
            statusClass = styles.info;
        }
    }


    return (
        <li className={`${styles.testCaseItem} ${statusClass}`}>
            <h4 onClick={() => setIsDetailsOpen(!isDetailsOpen)}>
                <span className={styles['status-icon']}>{statusIcon}</span>
                {testCase.status.includes('Custom Run') ? (
                    `Custom Run: ${testCase.status.replace(' (Custom Run)', '')}` // Display custom run verdict clearly
                ) : (
                    `Test Case ${index} ${testCase.isHidden ? '(Hidden)' : '(Sample)'}`
                )}
                <span className={`${styles['toggle-icon']} ${isDetailsOpen ? styles.rotated : ''}`} style={{ marginLeft: 'auto' }}>▶</span>
            </h4>
            {isDetailsOpen && (
                <div className={styles.testCaseDetails}>
                    <p><b>Input:</b></p>
                    <pre>{testCase.input}</pre>
                    <p><b>Expected Output:</b></p>
                    <pre>{testCase.expectedOutput}</pre>
                    {(testCase.status !== 'Accepted' && testCase.actualOutput) && ( // Show actual output if not accepted and actual output exists
                        <>
                            <p><b>Actual Output:</b></p>
                            <pre style={{ color: '#dc3545' }}>{testCase.actualOutput}</pre>
                        </>
                    )}
                    <p><b>Verdict:</b> <span className={statusClass}>{testCase.status}</span></p> {/* Display specific verdict */}
                    {testCase.time && <p><b>Time:</b> {testCase.time}</p>}
                    {testCase.memory && <p><b>Memory:</b> {testCase.memory}</p>}
                </div>
            )}
        </li>
    );
};