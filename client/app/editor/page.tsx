// client/app/editor/page.tsx
'use client';

import Image from 'next/image';
import Editor from "@monaco-editor/react";
import { useState, useRef, useEffect, useCallback } from "react";
import type { editor } from 'monaco-editor'; // Import Monaco editor types
import Link from 'next/link'; // Import next/link for optimized navigation

// Import the dedicated CSS file for this page
import './compiler-editor.css'; // <--- Ensure this path is correct!
// Import home styles for the navbar and theme classes
import homeStyles from '../home.module.css';

// Define interfaces for data structures
interface TestCaseResult {
    input: string;
    expectedOutput: string;
    actualOutput: string;
    status: string;
    time: string;
    memory: string;
    isHidden: boolean;
}

interface CompilerServiceResponse {
    overallVerdict: string;
    output: string;
    error?: string; // Optional error field
    testCaseResults?: TestCaseResult[];
}

// Boilerplate code for different languages
const boilerplate: { [key: string]: string } = {
    cpp: `#include <iostream>

int main() {
    // Your C++ code here
    std::cout << "Hello, CODECLASH!" << std::endl; // Recommended for newline and flush
    return 0;
}`,
    c: `#include <stdio.h>

int main() {
    // Your C code here
    printf("Hello, CODECLASH!");
    return 0;
}`,
    python: `# Python boilerplate
def solve():
    # Your code here
    print("Hello, CODECLASH!")

if __name__ == "__main__": # Corrected __name__ and __main__
    solve()`,
    java: `public class Main {
    public static void main(String[] args) {
        // Your Java code here
        System.out.println("Hello, CODECLASH!");
    }
}`
};

export default function CodeEditorPage() {
    const [code, setCode] = useState<string>(boilerplate.cpp);
    const [language, setLanguage] = useState<string>("cpp");
    const [input, setInput] = useState<string>("");
    const [output, setOutput] = useState<string>("Your program output will appear here.");
    const [errorLog, setErrorLog] = useState<string>("Compilation or runtime errors will be displayed here.");
    const [loading, setLoading] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>("output"); // 'input', 'output', 'error'
    const [executionTime, setExecutionTime] = useState<string>("N/A");
    const [memoryUsage, setMemoryUsage] = useState<string>("N/A");
    const [overallVerdict, setOverallVerdict] = useState<string>("Waiting for submission...");
    const [testCaseResults, setTestCaseResults] = useState<TestCaseResult[]>([]); // To display detailed test case results

    // Local state for theme, mirroring homepage/problems page
    const [isDarkTheme, setIsDarkTheme] = useState(true);

    // Refs for resizable panels
    const editorPanelRef = useRef<HTMLDivElement>(null);
    const consolePanelRef = useRef<HTMLDivElement>(null);
    const resizerRef = useRef<HTMLDivElement>(null);
    const monacoEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null); // Ref for Monaco editor instance

    // Effect to apply theme class to the body
    useEffect(() => {
        if (typeof document !== 'undefined') {
            const body = document.body;
            if (isDarkTheme) {
                body.classList.add('darkTheme');
                body.classList.remove('lightTheme');
            } else {
                body.classList.add('lightTheme');
                body.classList.remove('darkTheme');
            }
        }
    }, [isDarkTheme]);


    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLang = e.target.value;
        setLanguage(newLang);
        setCode(boilerplate[newLang] || ""); // Load boilerplate for new language
        setOutput("Your program output will appear here.");
        setErrorLog("Compilation or runtime errors will be displayed here.");
        setOverallVerdict("Waiting for submission...");
        setTestCaseResults([]);
    };

    const handleResetCode = () => {
        setCode(boilerplate[language] || "");
        setOutput("Your program output will appear here.");
        setErrorLog("Compilation or runtime errors will be displayed here.");
        setOverallVerdict("Waiting for submission...");
        setTestCaseResults([]);
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(code)
            .then(() => {
                console.log("Code copied to clipboard!");
            })
            .catch(err => {
                console.error('Failed to copy text using navigator.clipboard:', err);
                const textarea = document.createElement('textarea');
                textarea.value = code;
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    console.log("Code copied to clipboard!");
                } catch (execErr) {
                    console.error('Failed to copy text using execCommand:', execErr);
                } finally {
                    document.body.removeChild(textarea);
                }
            });
    };

    const handleClearInput = () => {
        setInput("");
    };

    const handleClearOutput = () => {
        setOutput("Your program output will appear here.");
        setErrorLog("Compilation or runtime errors will be displayed here.");
        setOverallVerdict("Waiting for submission...");
        setTestCaseResults([]);
    };

    const handleRun = async () => {
        setLoading(true);
        setOutput("");
        setErrorLog("");
        setOverallVerdict("Running...");
        setTestCaseResults([]);
        setActiveTab("output"); // Switch to output tab when running

        try {
            const problemId: string | null = null;
            const isCustomRun: boolean = true;

            const res = await fetch("http://localhost:8000/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ language, code, input, problemId, isCustomRun }),
            });

            const data: CompilerServiceResponse = await res.json();
            console.log("🔁 Compiler Service Response:", data);

            setOverallVerdict(data.overallVerdict || "Unknown Verdict");
            // The following lines assume data.testCaseResults[0] exists,
            // which is generally true for custom runs where there's only one "test case" (the custom input).
            // Consider adding more robust checks if this isn't always guaranteed.
            setExecutionTime(data.testCaseResults?.[0]?.time || "N/A");
            setMemoryUsage(data.testCaseResults?.[0]?.memory || "N/A");

            if (data.overallVerdict === "Compilation Error" || data.overallVerdict === "Runtime Error" || data.overallVerdict === "Server Error" || data.overallVerdict === "Backend Connection Error") {
                setErrorLog(data.output || data.error || "An error occurred.");
                setOutput("See Error/Debug Log tab for details.");
                setActiveTab("error");
            } else {
                setOutput(data.output || "No output generated.");
                setErrorLog("No errors.");
            }

            if (data.testCaseResults && Array.isArray(data.testCaseResults)) {
                setTestCaseResults(data.testCaseResults);
            } else {
                setTestCaseResults([]);
            }

        } catch (err: unknown) { // Changed 'any' to 'unknown'
            console.error("❌ Frontend error:", err);
            setOverallVerdict("Frontend Error");
            // Type narrowing for 'unknown' type
            if (err instanceof Error) {
                setErrorLog(`❌ Error connecting to compiler service: ${err.message}`);
            } else {
                setErrorLog(`❌ An unknown error occurred while connecting to compiler service.`);
            }
            setOutput("See Error/Debug Log tab for details.");
            setActiveTab("error");
        } finally {
            setLoading(false);
        }
    };

    // Resizer logic for horizontal split (left/right panels)
    const startResizing = useCallback((mouseDownEvent: MouseEvent) => {
        const editorPanel = editorPanelRef.current;
        const consolePanel = consolePanelRef.current;
        const resizer = resizerRef.current;
        if (!editorPanel || !consolePanel || !resizer) return;

        mouseDownEvent.preventDefault();

        const initialX = mouseDownEvent.clientX;
        const initialEditorWidth = editorPanel.offsetWidth;
        const initialConsoleWidth = consolePanel.offsetWidth;
        const parent = editorPanel.parentElement;
        if (!parent) return;

        const containerWidth = parent.clientWidth;
        const gapBetweenPanels = 16;
        const mainWorkspacePaddingX = 32 * 2;
        const totalHorizontalNonPanelSpace = gapBetweenPanels + mainWorkspacePaddingX;


        const doResize = (mouseMoveEvent: MouseEvent) => {
            const deltaX = mouseMoveEvent.clientX - initialX;
            let newEditorWidth = initialEditorWidth + deltaX;
            let newConsoleWidth = initialConsoleWidth - deltaX;

            const minWidth = 100;

            const availableContentWidth = containerWidth - totalHorizontalNonPanelSpace;
            const maxEditorWidth = availableContentWidth - minWidth;

            newEditorWidth = Math.max(minWidth, Math.min(newEditorWidth, maxEditorWidth));
            newConsoleWidth = availableContentWidth - newEditorWidth;


            editorPanel.style.width = `${newEditorWidth}px`;
            consolePanel.style.width = `${newConsoleWidth}px`;

            monacoEditorRef.current?.layout();
        };

        const stopResizing = () => {
            document.removeEventListener('mousemove', doResize);
            document.removeEventListener('mouseup', stopResizing);
            resizer.classList.remove('active');
        };

        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResizing);
        resizer.classList.add('active');
    }, []);

    // Effect to attach and cleanup resizer event listeners
    useEffect(() => {
        const resizer = resizerRef.current;
        if (resizer) {
            resizer.addEventListener('mousedown', startResizing);
        }
        return () => {
            if (resizer) {
                resizer.removeEventListener('mousedown', startResizing);
            }
        };
    }, [startResizing]);

    // Handle initial layout and window resize for Monaco Editor
    useEffect(() => {
        const handleResize = () => {
            monacoEditorRef.current?.layout();
        };

        window.addEventListener('resize', handleResize);

        if (monacoEditorRef.current) {
            monacoEditorRef.current.layout();
        }

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);


    return (
        <div className={`${homeStyles.homepage} ${isDarkTheme ? homeStyles.darkTheme : homeStyles.lightTheme}`}>
            {/* Navigation Bar - Copied directly from home/page.tsx */}
            <nav className={homeStyles.nav}>
                <Link href="/" className={homeStyles['logo-link']}>
                    <div className={homeStyles['logo-group']}>
                        <Image
                        src="/logo.svg"
                        alt="Codeclash Logo"
                        width={32}         // Use appropriate dimensions
                        height={32}
                        className={homeStyles['logo-icon']}
                        />

                        <span className={homeStyles['logo-text']}>CODECLASH</span>
                    </div>
                </Link>

                <div className={homeStyles['nav-links']}>
                    <Link href="/problems">
                        Problems
                    </Link>
                    <Link href="/editor" className={homeStyles.activeNavLink}> {/* Added activeNavLink for editor */}
                        Compiler
                    </Link>
                    <Link href="/dashboard">
                        Dashboard
                    </Link>
                    <Link href="/login">
                        Login
                    </Link>
                    <Link href="/signup">
                        <button className={homeStyles['btn-primary']}>
                            Sign Up
                        </button>
                    </Link>
                    {/* Theme Toggle Button */}
                    <button
                        onClick={() => setIsDarkTheme(!isDarkTheme)}
                        className={homeStyles['theme-toggle-btn']}
                    >
                        {isDarkTheme ? '☀' : '🌙'}
                    </button>
                </div>
            </nav>

            {/* Main Workspace Area */}
            <main className="main-workspace">
                {/* Code Editor Panel */}
                <section ref={editorPanelRef} className="editor-panel">
                    <div className="panel-header">
                        <h2 className="panel-title">Code Editor</h2>
                        <div className="panel-actions">
                            <label htmlFor="language-select" className="label-text">Language:</label>
                            <select
                                id="language-select"
                                value={language}
                                onChange={handleLanguageChange}
                                className="language-select"
                            >
                                <option value="python">Python</option>
                                <option value="cpp">C++</option>
                                <option value="c">C</option>
                                <option value="java">Java</option>
                            </select>
                            <button
                                onClick={handleRun}
                                disabled={loading}
                                className="btn btn-run"
                            >
                                {loading ? "Running..." : "Run Code"}
                            </button>
                            <button
                                onClick={handleResetCode}
                                className="btn btn-secondary"
                            >
                                Reset
                            </button>
                            <button
                                onClick={handleCopyCode}
                                className="btn-icon"
                            >
                                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-2M8 5a2 2 0 012-2h3a2 2 0 012 2v3m-7 0h7m-7 0V5m7 0v7"></path></svg>
                            </button>
                        </div>
                    </div>
                    <Editor
                        height="100%"
                        language={language === "python" ? "python" : language === "java" ? "java" : language}
                        value={code}
                        onChange={(value) => setCode(value || "")}
                        theme={isDarkTheme ? "vs-dark" : "vs-light"} // Dynamically set Monaco theme
                        options={{
                            fontSize: 14,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', monospace", // Ensure monospaced font
                        }}
                        className="code-editor-area"
                        onMount={(editorInstance) => {
                            monacoEditorRef.current = editorInstance;
                        }}
                    />
                </section>

                {/* Resizer Bar - Now vertical for horizontal split */}
                <div ref={resizerRef} className="resizer-vertical"></div>

                {/* Input/Output/Console Panel */}
                <section ref={consolePanelRef} className="console-panel">
                    <div className="panel-header">
                        <div className="tab-buttons">
                            <button
                                onClick={() => setActiveTab("input")}
                                className={`tab-button ${activeTab === "input" ? "active" : ""}`}
                            >
                                Input
                            </button>
                            <button
                                onClick={() => setActiveTab("output")}
                                className={`tab-button ${activeTab === "output" ? "active" : ""}`}
                            >
                                Output
                            </button>
                            <button
                                onClick={() => setActiveTab("error")}
                                className={`tab-button ${activeTab === "error" ? "active" : ""}`}
                            >
                                Error/Debug Log
                            </button>
                        </div>
                        <div className="panel-actions">
                            <button
                                onClick={handleClearInput}
                                className="btn-icon"
                            >
                                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                            <button
                                onClick={handleClearOutput}
                                className="btn-icon"
                            >
                                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="tab-content-area">
                        {activeTab === "input" && (
                            <textarea
                                className="input-textarea"
                                placeholder="Enter custom input here..."
                                value={input}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                            ></textarea>
                        )}
                        {activeTab === "output" && (
                            <div className="output-container">
                                <pre className="console-output">
                                    <span className={overallVerdict === "Accepted" ? "status-success" : "status-error"}>
                                        Verdict: {overallVerdict}
                                    </span>
                                    <br/>
                                    {output}
                                </pre>
                                <div className="execution-metrics">
                                    Execution Time: <span className="metric-value">{executionTime}</span> | Memory Usage: <span className="metric-value">{memoryUsage}</span>
                                </div>

                                {testCaseResults.length > 0 && (
                                    <div className="test-case-details">
                                        <h3 className="test-case-title">Test Case Details:</h3>
                                        {testCaseResults.map((tc, index) => (
                                            <div key={index} className="test-case-card">
                                                <p className="test-case-header">Test Case {index + 1} ({tc.isHidden ? 'Hidden' : 'Sample'})</p>
                                                <p className="test-case-status">Status: <span className={tc.status === "Accepted" ? "status-success" : "status-error"}>{tc.status}</span></p>
                                                <p className="test-case-metrics">Time: {tc.time} | Memory: {tc.memory}</p>
                                                {!tc.isHidden && (
                                                    <>
                                                        <p className="test-case-label">Input:</p>
                                                        <pre className="test-case-code-block">{tc.input}</pre>
                                                        <p className="test-case-label">Expected Output:</p>
                                                        <pre className="test-case-code-block">{tc.expectedOutput}</pre>
                                                        <p className="test-case-label">Actual Output:</p>
                                                        <pre className="test-case-code-block">{tc.actualOutput}</pre>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === "error" && (
                            <pre className="console-output error-log">{errorLog}</pre>
                        )}
                    </div>
                </section>
            </main>

            {/* Footer - Copied directly from home/page.tsx */}
            <footer className={homeStyles.footer}>
                <div className={homeStyles['footer-content']}>
                    <div className={homeStyles['logo-group']}>
                        <Image
                        src="/logo.svg"
                        alt="Codeclash Logo"
                        width={32}
                        height={32}
                        className={homeStyles['logo-icon']}
                        />
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