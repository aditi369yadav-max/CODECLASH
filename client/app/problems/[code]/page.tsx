'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Problem {
  _id: string;
  title: string;
  code: string;
  description: string;
  difficulty: string;
  timeLimit: number;
  createdAt: string;
}

export default function ProblemDetailPage() {
  const params = useParams();
  const code = params?.code as string;
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;

    fetch('http://localhost:5000/api/problems')
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((p: Problem) => p.code === code);
        setProblem(found);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load problem:', err);
        setLoading(false);
      });
  }, [code]);

  if (loading) return <main style={{ padding: '2rem' }}>⏳ Loading...</main>;
  if (!problem) return <main style={{ padding: '2rem' }}>❌ Problem not found.</main>;

  return (
    <main style={{ padding: '3rem', maxWidth: '800px', margin: 'auto' }}>
      <h1 style={{ fontSize: '2.5rem', color: '#fff', marginBottom: '1rem' }}>{problem.title}</h1>
      <p style={{ color: '#aaa', marginBottom: '0.5rem' }}>
        <strong>Difficulty:</strong>{' '}
        <span style={{ color: getDifficultyColor(problem.difficulty) }}>
          {problem.difficulty}
        </span>
      </p>
      <p style={{ color: '#bbb', marginBottom: '0.5rem' }}>
        <strong>Time Limit:</strong> {problem.timeLimit} sec
      </p>
      <hr style={{ margin: '1.5rem 0', borderColor: '#444' }} />
      <p style={{ color: '#ccc', lineHeight: '1.7', fontSize: '1.1rem' }}>{problem.description}</p>
    </main>
  );
}

function getDifficultyColor(diff: string) {
  switch (diff) {
    case 'Easy':
      return '#7CFC00';
    case 'Medium':
      return '#FFD700';
    case 'Hard':
      return '#FF6347';
    default:
      return '#aaa';
  }
}
