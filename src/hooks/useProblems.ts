import { useState, useEffect, useCallback } from 'react';
import type { Problem, ProblemsData } from '../types';

export function useProblems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch('/problems.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load problems');
        return res.json();
      })
      .then((data: ProblemsData) => {
        setProblems(data.problems);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  const getRandomProblem = useCallback((): Problem | null => {
    if (problems.length === 0) return null;
    const index = Math.floor(Math.random() * problems.length);
    return problems[index];
  }, [problems]);

  return { problems, loading, error, getRandomProblem };
}
