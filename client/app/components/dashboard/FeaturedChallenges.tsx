// client/app/components/dashboard/FeaturedChallenges.tsx
import React from 'react';
import Button from '@/app/components/Button'; // Assuming your Button component path

interface Challenge {
  title: string;
  type: string;
  progress: number; // Percentage
}

interface FeaturedChallengesProps {
  challenges?: Challenge[];
}

const FeaturedChallenges: React.FC<FeaturedChallengesProps> = ({ challenges }) => {
  // Mock data as per the new dashboard design
  const mockChallenges: Challenge[] = challenges || [
    { title: 'Daily Coding Challenge: Arrays', type: 'Daily Problem', progress: 75 },
    { title: 'Weekly Dynamic Programming Marathon', type: 'Contest Series', progress: 30 },
    { title: 'Introduction to Graph Theory', type: 'Tutorial Series', progress: 90 },
    { title: 'Top 100 Interview Questions', type: 'Problem Set', progress: 50 },
  ];

  return (
    <div className="card featured-challenges-card">
      <h3 className="card-title">Featured Challenges</h3>
      <div className="challenges-list">
        {mockChallenges.map((challenge, index) => (
          <div key={index} className="challenge-item">
            <h4 className="challenge-title">{challenge.title}</h4>
            <p className="challenge-type">{challenge.type}</p>
            <div className="challenge-progress">
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${challenge.progress}%` }}
                ></div>
              </div>
              <span className="progress-percent">{challenge.progress}%</span>
            </div>
            <Button className="join-challenge-btn" onClick={() => console.log(`Join ${challenge.title} clicked`)}>
              Join Challenge
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedChallenges;