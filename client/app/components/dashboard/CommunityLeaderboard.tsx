// client/app/components/dashboard/CommunityLeaderboard.tsx
import React from 'react';
import Button from '@/app/components/Button'; // Assuming your Button component path

interface LeaderboardUser {
  rank: number;
  username: string;
  points: number;
}

interface CommunityLeaderboardProps {
  // You would typically fetch this data from your backend
  // For now, we'll use mock data
  leaderboardData?: LeaderboardUser[];
  userProgress?: {
    currentPercent: number; // e.g., 70 for 70%
    nextMilestone: string; // e.g., "next"
  };
}

const CommunityLeaderboard: React.FC<CommunityLeaderboardProps> = ({
  leaderboardData,
  userProgress,
}) => {
  // Mock data as per the new dashboard design
  const mockLeaderboard: LeaderboardUser[] = leaderboardData || [
    { rank: 1, username: 'CodeMaster', points: 12500 },
    { rank: 2, username: 'AlgoWhiz', points: 11800 },
    { rank: 3, username: 'DataDiva', points: 10500 },
    { rank: 4, username: 'ByteBard', points: 9800 },
    { rank: 5, username: 'SyntaxSavvy', points: 9200 },
  ];

  const mockUserProgress = userProgress || {
    currentPercent: 70, //
    nextMilestone: 'next', //
  };

  return (
    <div className="card community-leaderboard-card">
      <h3 className="card-title">Community Leaderboard</h3>
      <ul className="leaderboard-list">
        {mockLeaderboard.map((user) => (
          <li key={user.rank} className="leaderboard-item">
            <span className="rank">{user.rank}.</span>
            <span className="username">{user.username}</span>
            <span className="points">{user.points} pts</span>
          </li>
        ))}
      </ul>
      <div className="user-progress-section">
        <p className="your-progress-label">Your Progress</p>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${mockUserProgress.currentPercent}%` }}
          ></div>
        </div>
        <p className="progress-details">{mockUserProgress.currentPercent}% {mockUserProgress.nextMilestone}</p>
      </div>
      <Button className="view-full-leaderboard-btn" onClick={() => console.log('View Full Leaderboard clicked')}>
        View Full Leaderboard
      </Button>
    </div>
  );
};

export default CommunityLeaderboard;