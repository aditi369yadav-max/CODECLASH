// client/app/components/dashboard/RecentActivity.tsx
import React from 'react';

// Define a common interface for all activity items that will be displayed
interface ActivityItem {
  type: string; // e.g., 'achievement', 'submission', 'contest', 'attempt', 'comment'
  date: Date; // Actual Date object
  description: string;
  timeAgo?: string; // Make timeAgo optional as it's not always available for initial props
}

interface Achievement {
  date: string; // ISO string format for Date
  description: string;
}

interface DailySubmission {
  date: string; // ISO string format for Date
  count: number;
}

interface RecentActivityProps {
  achievements: Achievement[];
  submissions: DailySubmission[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ achievements, submissions }) => {
  const allActivities: ActivityItem[] = [ // Explicitly type allActivities
    ...achievements.map(a => ({
      type: 'achievement',
      date: new Date(a.date),
      description: a.description,
    })),
    // Mock data for display, these directly implement ActivityItem
    { type: 'submission', date: new Date(new Date().getTime() - 2 * 60 * 1000), description: 'Submitted "Two Sum" problem (Python)', timeAgo: '2 mins ago' }, //
    { type: 'contest', date: new Date(new  Date().getTime() - 1 * 60 * 60 * 1000), description: 'Participated in Weekly Contest #385', timeAgo: '1 hour ago' }, //
    { type: 'attempt', date: new Date(new Date().getTime() - 3 * 60 * 60 * 1000), description: 'Attempted "Longest Substring Without Repeating Characters"', timeAgo: '3 hours ago' }, //
    { type: 'comment', date: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000), description: 'Commented on "Best Practices for Dynamic Programming"', timeAgo: '1 day ago' }, //
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const displayActivities = allActivities.slice(0, 5);

  return (
    <div className="card recent-activity-card">
      <h3 className="card-title">Recent Activity</h3>
      <div className="activity-list">
        {displayActivities.length > 0 ? (
          <ul>
            {displayActivities.map((activity, index) => (
              <li key={index} className="activity-item">
                <span className="activity-description">{activity.description}</span>
                {/* Now 'activity' is correctly typed as ActivityItem, so timeAgo is known */}
                <span className="activity-time">{activity.timeAgo || activity.date.toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-sm italic">No recent activity to display.</p>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;