// client/app/components/dashboard/ProblemDistribution.tsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ProblemDistributionData {
  name: string; // e.g., "Easy", "Medium", "Hard"
  value: number; // Number of problems solved in this difficulty
}

interface ProblemDistributionProps {
  totalSolved: number;
  totalProblems: number;
  distribution: ProblemDistributionData[];
  unattemptedCount: number; // Number of problems unattempted
}

// Colors for Easy, Medium, Hard. Ensure these match your design system.
// The mockup shows green for easy, purple for medium, yellow for hard.
const COLORS = {
  Easy: '#82ca9d', // Greenish
  Medium: '#8884d8', // Purplish
  Hard: '#ffc658',  // Yellowish
};

const ProblemDistribution: React.FC<ProblemDistributionProps> = ({
  totalSolved,
  totalProblems,
  distribution,
  unattemptedCount,
}) => {
  return (
    <div className="card problem-distribution-card">
      <h3 className="card-title">Problem Distribution</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={distribution}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8" // Default fill, individual cells will override
              paddingAngle={5}
              dataKey="value"
              labelLine={false} // Hide lines connecting labels to slices
              // You can add custom labels if needed, e.g., label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {distribution.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={COLORS[entry.name as keyof typeof COLORS]} // Use colors based on name
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="center-text">
          <p className="total-solved-count">{totalSolved}</p>
          <p className="total-solved-label">Solved</p>
        </div>
      </div>
      <div className="problem-stats-details">
        {/* Display individual difficulty counts as shown in the mockup */}
        {distribution.map((entry) => (
          <div key={entry.name} className="difficulty-stat-item">
            <span className="difficulty-color-dot" style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] }}></span>
            <span className="difficulty-name">{entry.name}</span>
            <span className="difficulty-count">{entry.value}</span>
          </div>
        ))}
        <div className="overall-attempt-info">
            <p className="unattempted-info">
                <span className="unattempted-count">{unattemptedCount}</span> Attempting
            </p>
            <p className="total-problem-info">
                <span className="total-problems-count">{totalProblems}</span> Total
            </p>
        </div>
      </div>
    </div>
  );
};

export default ProblemDistribution;