import { useCallback, useEffect, useState } from 'react';
import { FiAward } from 'react-icons/fi';
import PageHeader from './PageHeader.jsx';
import MarcieFlight from './games/MarcieFlight.jsx';
import marcieIcon from '../assets/marcie.png';
import { fetchGameState, startGameTry, finishGameTry } from '../api.js';

// Add new mini games here. Each entry needs an id the Team Fund API knows (lib/games.ts).
const GAMES = [
  {
    id: 'marcie-flight',
    title: "Marcie's flight",
    description: 'Fly Marcie through the gaps between the towers.',
    icon: marcieIcon,
    Component: MarcieFlight,
  },
];

function Leaderboard({ state, userId }) {
  const [tab, setTab] = useState('monthly');
  const board = state?.[tab];
  const monthLabel = state?.month
    ? new Date(`${state.month}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : 'This month';
  const me = board?.me;
  const meInTop = me && board.top.some(e => e.userId === me.userId);

  return (
    <section className="games-board" aria-labelledby="board-title">
      <div className="games-board-head">
        <h2 id="board-title"><FiAward aria-hidden="true" /> Leaderboard</h2>
        <div className="games-board-tabs" role="tablist" aria-label="Leaderboard period">
          <button role="tab" aria-selected={tab === 'monthly'} className={tab === 'monthly' ? 'active' : ''} onClick={() => setTab('monthly')}>{monthLabel}</button>
          <button role="tab" aria-selected={tab === 'allTime'} className={tab === 'allTime' ? 'active' : ''} onClick={() => setTab('allTime')}>All time</button>
        </div>
      </div>
      <p className="games-board-note">Best score per person. {board ? `${board.players} ${board.players === 1 ? 'player' : 'players'}.` : ''}</p>

      {!board ? (
        <p className="games-board-empty">Loading leaderboard…</p>
      ) : board.top.length === 0 ? (
        <p className="games-board-empty">No scores yet. Be the first on the board.</p>
      ) : (
        <table className="games-board-table">
          <thead>
            <tr><th scope="col">Rank</th><th scope="col">Name</th><th scope="col" className="num">Best</th><th scope="col" className="num">Tries</th></tr>
          </thead>
          <tbody>
            {board.top.map(e => (
              <tr key={e.userId} className={e.userId === userId ? 'me' : ''}>
                <td><span className={`games-rank r${e.rank}`}>{e.rank}</span></td>
                <td>{e.userName}{e.userId === userId && <span className="games-you"> (you)</span>}</td>
                <td className="num">{e.best}</td>
                <td className="num">{e.tries}</td>
              </tr>
            ))}
            {me && !meInTop && (
              <tr className="me">
                <td><span className="games-rank">{me.rank}</span></td>
                <td>{me.userName}<span className="games-you"> (you)</span></td>
                <td className="num">{me.best}</td>
                <td className="num">{me.tries}</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default function GamesPage({ userId, userName, showToast }) {
  const [gameId, setGameId] = useState(GAMES[0].id);
  const [state, setState] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tryId, setTryId] = useState(null);
  const game = GAMES.find(g => g.id === gameId) || GAMES[0];

  const load = useCallback(async ({ reset = false } = {}) => {
    if (reset) setState(null);
    try {
      setLoadError('');
      setState(await fetchGameState(gameId, userId));
    } catch (err) {
      setLoadError("We couldn't load your tries and the leaderboard. Check your connection and try again.");
      console.warn('Games state error:', err.message);
    }
  }, [gameId, userId]);

  useEffect(() => { load({ reset: true }); }, [load]);

  const handleStart = useCallback(async () => {
    setBusy(true);
    try {
      const res = await startGameTry(gameId, userId, userName);
      setTryId(res.tryId);
      setState(s => (s ? { ...s, triesLeft: res.triesLeft, triesUsed: s.maxTries - res.triesLeft } : s));
      return true;
    } catch (err) {
      showToast?.(err.status === 429 ? "You've used all 3 tries today." : "We couldn't start the game. Try again.", 'error');
      load();
      return false;
    } finally {
      setBusy(false);
    }
  }, [gameId, userId, userName, showToast, load]);

  const handleFinish = useCallback(async (score, opts = {}) => {
    if (!tryId) return;
    const id = tryId;
    setTryId(null);
    if (opts.leaving) {
      finishGameTry(gameId, userId, id, score, { keepalive: true }).catch(() => {});
      return;
    }
    setBusy(true);
    try {
      await finishGameTry(gameId, userId, id, score);
    } catch (err) {
      showToast?.("We couldn't save that score. It won't count on the leaderboard.", 'error');
      console.warn('Games finish error:', err.message);
    } finally {
      setBusy(false);
      load();
    }
  }, [tryId, gameId, userId, showToast, load]);

  const GameComponent = game.Component;
  const triesLeft = state?.triesLeft ?? 0;

  return (
    <div className="dashboard-container games-page animate-fade-in">
      <PageHeader
        title="Games"
        subtitle="Take a short break. Each game gives you 3 tries a day (WIB); your best score goes on the leaderboard."
      />

      {GAMES.length > 1 && (
        <div className="games-picker" role="tablist" aria-label="Choose a game">
          {GAMES.map(g => (
            <button key={g.id} role="tab" aria-selected={g.id === gameId} className={g.id === gameId ? 'active' : ''} onClick={() => setGameId(g.id)}>
              <img src={g.icon} alt="" /> {g.title}
            </button>
          ))}
        </div>
      )}

      <div className="games-layout">
        <section className="games-stage" aria-labelledby="game-title">
          <div className="games-stage-head">
            <div>
              <h2 id="game-title">{game.title}</h2>
              <p>{game.description}</p>
            </div>
            {state && (
              <div className="games-tries" aria-label={`${state.triesLeft} of ${state.maxTries} tries left today`}>
                {Array.from({ length: state.maxTries }, (_, i) => (
                  <span key={i} className={i < state.triesLeft ? 'left' : 'used'} aria-hidden="true" />
                ))}
                <span className="games-tries-text">{state.triesLeft} of {state.maxTries} tries left</span>
              </div>
            )}
          </div>

          {loadError ? (
            <div className="games-error">
              <p>{loadError}</p>
              <button type="button" className="btn-secondary" onClick={() => load()}>Try again</button>
            </div>
          ) : !state ? (
            <p className="games-loading">Loading your tries…</p>
          ) : (
            <>
              <GameComponent triesLeft={triesLeft} onStart={handleStart} onFinish={handleFinish} busy={busy} />
              {state.bestToday > 0 && <p className="games-best">Your best today: <strong>{state.bestToday}</strong></p>}
            </>
          )}
        </section>

        <Leaderboard state={state} userId={userId} />
      </div>
    </div>
  );
}
