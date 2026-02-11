import { useAppContext } from '../../store/AppContext';
import { useProgressService, useLevelService } from '../../contexts/ServiceContext';
import { useTranslation, type TranslationKey } from '../../i18n';
import type { AttemptRecord } from '../../types/levels';
import './AttemptHeatmap.css';

const MAX_SESSIONS = 10;

interface SessionData {
  sessionId: string;
  attempts: AttemptRecord[];
  levelId: string;
  correct: number;
  total: number;
  firstTimestamp: string;
}

function groupBySessions(attempts: AttemptRecord[], maxSessions: number): SessionData[] {
  const sessionMap = new Map<string, AttemptRecord[]>();

  for (const attempt of attempts) {
    const sid = attempt.sessionId;
    if (!sessionMap.has(sid)) {
      sessionMap.set(sid, []);
    }
    sessionMap.get(sid)!.push(attempt);
  }

  // Convert to SessionData, sorted by first timestamp descending (most recent first)
  const sessions: SessionData[] = Array.from(sessionMap.entries()).map(([sessionId, records]) => {
    const sorted = records.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const correct = sorted.filter(r => r.isCorrect).length;
    return {
      sessionId,
      attempts: sorted,
      levelId: sorted[0].levelId,
      correct,
      total: sorted.length,
      firstTimestamp: sorted[0].timestamp,
    };
  });

  sessions.sort((a, b) => b.firstTimestamp.localeCompare(a.firstTimestamp));
  return sessions.slice(0, maxSessions);
}

function formatSessionTime(timestamp: string, t: (key: TranslationKey, params?: Record<string, string | number>) => string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (diffDays === 0) {
    return `${t('heatmap.today')} ${time}`;
  }
  if (diffDays === 1) {
    return `${t('heatmap.yesterday')} ${time}`;
  }
  if (diffDays < 30) {
    return t('heatmap.daysAgo', { count: diffDays });
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function AttemptHeatmap() {
  const { state } = useAppContext();
  const progressService = useProgressService();
  const levelService = useLevelService();
  const { t, uiLanguage } = useTranslation();

  if (!state.mode) return null;

  const progress = progressService.getProgress(state.mode);

  if (progress.attemptHistory.length === 0) {
    return (
      <div className="heatmap-container">
        <div className="heatmap-header">
          <span className="heatmap-title">{t('heatmap.title')}</span>
        </div>
        <div className="heatmap-empty">{t('heatmap.noAttempts')}</div>
      </div>
    );
  }

  const sessions = groupBySessions(progress.attemptHistory, MAX_SESSIONS);
  const activeDays = new Set(progress.attemptHistory.map(a => a.timestamp.slice(0, 10))).size;
  const accuracy = progress.totals.attempts > 0
    ? Math.round((progress.totals.correct / progress.totals.attempts) * 100)
    : 0;

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <span className="heatmap-title">{t('heatmap.title')}</span>
        <div className="heatmap-legend">
          <span className="legend-item">
            <span className="legend-swatch correct" /> {t('heatmap.correct')}
          </span>
          <span className="legend-item">
            <span className="legend-swatch incorrect" /> {t('heatmap.incorrect')}
          </span>
        </div>
      </div>

      <div className="session-list">
        {sessions.map(session => {
          const level = levelService.getLevelById(session.levelId);
          const levelName = level
            ? (uiLanguage === 'ja' ? level.nameJa : level.name)
            : session.levelId;
          const pct = Math.round((session.correct / session.total) * 100);

          return (
            <div key={session.sessionId} className="session-row">
              <div className="session-label">
                <span className="session-time">{formatSessionTime(session.firstTimestamp, t)}</span>
                <span className="session-meta">
                  <span className="session-level">{levelName}</span>
                  <span className="session-score">{session.correct}/{session.total} ({pct}%)</span>
                </span>
              </div>
              <div className="session-squares">
                {session.attempts.map((attempt, i) => (
                  <div
                    key={i}
                    className={`attempt-square ${attempt.isCorrect ? 'correct' : 'incorrect'}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="heatmap-stats">
        <div className="heatmap-stat">
          <span className="heatmap-stat-value">{progress.totals.bestStreak}</span>
          <span className="heatmap-stat-label">{t('heatmap.bestStreak')}</span>
        </div>
        <div className="heatmap-stat">
          <span className="heatmap-stat-value">{progress.totals.attempts}</span>
          <span className="heatmap-stat-label">{t('heatmap.attempts')}</span>
        </div>
        <div className="heatmap-stat">
          <span className="heatmap-stat-value">{accuracy}%</span>
          <span className="heatmap-stat-label">{t('heatmap.accuracy')}</span>
        </div>
        <div className="heatmap-stat">
          <span className="heatmap-stat-value">{activeDays}</span>
          <span className="heatmap-stat-label">{t('heatmap.activeDays')}</span>
        </div>
      </div>
    </div>
  );
}
