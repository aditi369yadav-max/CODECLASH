// client/app/components/dashboard/SkillProficiency.tsx
import React from 'react';

interface SkillProficiencyProps {
  languageProficiency: {
    [langName: string]: string; // e.g., "Python": "85%"
  };
  skillTreeProgress: {
    [skillName: string]: { level: number; xp: number }; // e.g., "Data Structures": {level: 1, xp: 50}
  };
}

const SkillProficiency: React.FC<SkillProficiencyProps> = ({
  languageProficiency,
  skillTreeProgress,
}) => {
  // Helper to parse proficiency string (e.g., "85%") to a number
  const parseProficiency = (proficiency: string): number => {
    const match = proficiency.match(/(\d+\.?\d*)%/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Helper to calculate a rough percentage for skillTreeProgress (you might have a better metric)
  const calculateSkillPercentage = (skill: { level: number; xp: number }): number => {
    // This is a placeholder. You'll need to define how skill level/xp maps to a percentage.
    // For example, if max level is 10, then level * 10%. Or based on XP thresholds.
    // Here, just a simple example:
    return Math.min(100, skill.level * 15 + skill.xp / 10); // Example calculation
  };

  return (
    <div className="card skill-proficiency-card">
      <h3 className="card-title">Skill Proficiency</h3>
      <div className="skill-list">
        {/* Languages */}
        {Object.entries(languageProficiency).map(([lang, proficiency]) => (
          <div key={lang} className="skill-item">
            <span className="skill-name">{lang}</span>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${parseProficiency(proficiency)}%` }}
              ></div>
            </div>
            <span className="proficiency-percent">{proficiency}</span>
          </div>
        ))}

        {/* Data Structures and Algorithms (from skillTreeProgress) */}
        {Object.entries(skillTreeProgress).map(([skill, data]) => {
          // Filter for skills that are generally "Data Structures" or "Algorithms" related
          if (skill === 'Data Structures' || skill === 'Algorithms' || skill === 'SQL') { // Example filter
            const percentage = calculateSkillPercentage(data);
            return (
              <div key={skill} className="skill-item">
                <span className="skill-name">{skill}</span>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="proficiency-percent">{percentage.toFixed(0)}%</span>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default SkillProficiency;