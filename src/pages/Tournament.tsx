import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournamentStore } from '../store/tournament';
import MatchupView from '../components/MatchupView';
import ProgressBar from '../components/ProgressBar';
import type { MatchResult } from '../types';

export default function Tournament() {
  const { phase, tournament, recordMatchResult, getCurrentMatchup } =
    useTournamentStore();
  const navigate = useNavigate();

  // Redirect if not playing
  useEffect(() => {
    if (phase === 'landing' || !tournament) {
      navigate('/', { replace: true });
    } else if (phase === 'results') {
      navigate('/results', { replace: true });
    }
  }, [phase, tournament, navigate]);

  if (!tournament || phase !== 'playing') return null;

  const matchup = getCurrentMatchup();
  if (!matchup) return null;

  const [left, right] = matchup;

  const handleResult = (result: MatchResult) => {
    recordMatchResult(result);
  };

  return (
    <div className="flex min-h-dvh flex-col px-4 py-6">
      <ProgressBar
        currentRound={tournament.currentRound}
        totalRounds={tournament.totalRounds}
        currentMatchup={tournament.currentMatchupIndex}
        totalMatchups={tournament.currentMatchups.length}
      />

      <div className="flex flex-1 flex-col justify-center py-4">
        <MatchupView left={left} right={right} onResult={handleResult} />
      </div>
    </div>
  );
}
