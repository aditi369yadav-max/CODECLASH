// client/app/components/dashboard/SubmissionsHeatmap.tsx
import React from 'react';

// This interface defines the expected structure for a day's data in the heatmap
interface DailySubmissionData {
  date: string; // YYYY-MM-DD
  count: number; // Number of submissions on that day
}

interface SubmissionsHeatmapProps {
  totalSubmissionsYear: number;
  maxActiveDays: number;
  maxStreak: number;
  submissionData: DailySubmissionData[]; // Array of submission data for the year
}

const SubmissionsHeatmap: React.FC<SubmissionsHeatmapProps> = ({
  totalSubmissionsYear,
  maxActiveDays,
  maxStreak,
  submissionData, // This prop would contain the actual daily submission counts
}) => {
  // Mock data for the heatmap grid based on the image
  // In a real application, you'd generate this grid dynamically based on submissionData
  const mockHeatmapGrid = Array.from({ length: 12 * 30 }, (_, i) => ({
    date: `2024-01-${(i % 30) + 1}`, // Placeholder date
    level: Math.floor(Math.random() * 5), // 0-4 levels for intensity (adjust for more realistic data)
  }));

  const months = [
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov',
    'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'
  ]; // Month order to match the image, starting with July

  return (
    <div className="card submissions-heatmap-card">
      <h3 className="card-title">{totalSubmissionsYear} submissions in the past one year</h3>
      <div className="heatmap-stats">
        <span className="stat-item">Total active days: <span className="stat-value">{maxActiveDays}</span></span>
        <span className="stat-item">Max streak: <span className="stat-value">{maxStreak}</span></span>
      </div>
      <div className="heatmap-grid-wrapper">
        {/* Optional: Days of the week labels (Mon, Wed, Fri etc.) can be added here if desired */}
        {/*
        <div className="day-labels">
          <span>Mon</span>
          <span></span>
          <span>Wed</span>
          <span></span>
          <span>Fri</span>
          <span></span>
          <span>Sun</span>
        </div>
        */}
        <div className="heatmap-grid">
          {mockHeatmapGrid.map((day, index) => (
            // Apply different classes based on 'level' for color intensity
            <div
              key={index}
              className={`day-box level-${day.level}`}
              title={`Date: ${day.date}, Submissions: ${day.level * 2}`} // Example tooltip
            >
              {/* Day box content (empty for just color) */}
            </div>
          ))}
        </div>
        <div className="heatmap-months">
          {months.map(month => (
            <span key={month} className="month-label">{month}</span>
          ))}
        </div>
      </div>
      <div className="heatmap-legend">
        <div className="legend-item"><span className="color-box level-0"></span>Less</div>
        <div className="legend-item"><span className="color-box level-1"></span></div>
        <div className="legend-item"><span className="color-box level-2"></span></div>
        <div className="legend-item"><span className="color-box level-3"></span></div>
        <div className="legend-item"><span className="color-box level-4"></span>More</div>
      </div>
    </div>
  );
};

export default SubmissionsHeatmap;