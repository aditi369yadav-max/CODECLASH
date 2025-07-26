// client/app/components/dashboard/OverallProgress.tsx
import React from 'react';

interface OverallProgressProps {
  totalSolved: number;
  totalProblems: number;
  globalRank: number;
  accuracy: number; // e.g., 78.5 for 78.5%
}

const OverallProgress: React.FC<OverallProgressProps> = ({
  totalSolved,
  totalProblems,
  globalRank,
  accuracy,
}) => {
  const problemsSolvedText = `${totalSolved}/${totalProblems}`;
  const accuracyText = `${accuracy.toFixed(1)}%`; // Format to one decimal place

  // Calculate the percentage for the circular progress (for visual representation, adjust as needed)
  const solvedPercentage = (totalSolved / totalProblems) * 100;

  return (
    <div className="card overall-progress-card">
      <h3 className="card-title">Overall Progress</h3>
      <div className="progress-content">
        <div className="circular-progress-container">
          {/* This div represents the circular progress bar.
              You'll likely use CSS conic-gradient or an SVG library for the actual circle.
              For now, it's a placeholder. */}
          <div
            className="circular-progress-circle"
            style={{
              // This is a basic inline style for a pseudo-progress bar.
              // For a real circular progress bar, you'd use a more sophisticated approach
              // (e.g., SVG, dedicated library like react-circular-progressbar, or complex CSS).
              background: `conic-gradient(var(--brand-primary) ${solvedPercentage}%, var(--bg-dark-secondary) ${solvedPercentage}%)`,
            }}
          >
            <span className="problems-solved-count">{problemsSolvedText}</span>
            <span className="problems-solved-label">Problems Solved</span>
          </div>
        </div>
        <div className="progress-stats">
          <div className="stat-item">
            <span className="stat-number">{globalRank.toLocaleString()}</span>
            <span className="stat-label">Global Rank</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{accuracyText}</span>
            <span className="stat-label">Accuracy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallProgress;