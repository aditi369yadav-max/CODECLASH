// client/app/components/dashboard/ProblemRecommendations.tsx
import React from 'react';
import Button from '@/app/components/Button'; // Assuming your Button component path

export interface RecommendedProblem {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  link?: string; // Optional: if you have a link to the problem
}

interface ProblemRecommendationsProps {
  recommendations: RecommendedProblem[];
}

const ProblemRecommendations: React.FC<ProblemRecommendationsProps> = ({ recommendations }) => {
  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'diff-easy';
      case 'medium':
        return 'diff-medium';
      case 'hard':
        return 'diff-hard';
      default:
        return '';
    }
  };

  return (
    <div className="card recommended-problems-card">
      <h3 className="card-title">Recommended Problems</h3>
      <ul className="recommendations-list">
        {recommendations.length > 0 ? (
          recommendations.map((problem, index) => (
            <li key={index} className="recommendation-item">
              <a href={problem.link || '#'} className="problem-title">{problem.title}</a>
              <span className={`difficulty-tag ${getDifficultyClass(problem.difficulty)}`}>
                {problem.difficulty}
              </span>
            </li>
          ))
        ) : (
          <p className="text-gray-400 text-sm italic">No personalized recommendations available.</p>
        )}
      </ul>
      <Button className="view-all-recommendations-btn" onClick={() => console.log('View All Recommendations clicked')}>
        View All Recommendations
      </Button>
    </div>
  );
};

export default ProblemRecommendations;