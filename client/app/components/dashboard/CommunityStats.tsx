// client/app/components/dashboard/CommunityStats.tsx
import React from 'react';

interface CommunityStatsProps {
  views: number;
  solutions: number;
  discuss: number;
  reputation: number;
}

const CommunityStats: React.FC<CommunityStatsProps> = ({
  views,
  solutions,
  discuss,
  reputation,
}) => {
  return (
    <div className="card community-stats-card">
      <h3 className="card-title">Community Stats</h3>
      <ul className="stats-list">
        <li className="stat-item">
          <span className="stat-label">Views</span>
          <span className="stat-value">{views.toLocaleString()}</span>
        </li>
        <li className="stat-item">
          <span className="stat-label">Solutions</span>
          <span className="stat-value">{solutions}</span>
        </li>
        <li className="stat-item">
          <span className="stat-label">Discuss</span>
          <span className="stat-value">{discuss}</span>
        </li>
        <li className="stat-item">
          <span className="stat-label">Reputation</span>
          <span className="stat-value">{reputation}</span>
        </li>
      </ul>
    </div>
  );
};

export default CommunityStats;