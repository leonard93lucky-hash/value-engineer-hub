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
  const [loadFailed, setLoadFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tryId, setTryId] = useState(null);
  const game = GAMES.find(g => g.id === gameId) || GAMES[0];

  // Load tries + leaderboard. Retries quietly; once the page has data, a failed refresh
  // keeps the current view and tries again in the background instead of showing an error.
  const load = useCallback(async ({ reset = false } = {}) => {
    if (reset) { setState(null); setLoadFailed(false); }
    setRefreshing(true);
    const delays = [0, 800, 2000];
    for (let i = 0; i < delays.length; i++) {
      if (delays[i]) await new Promise(r => setTimeout(r, delays[i]));
      try {
        const next = await fetchGameState(gameId, userId);
        setState(next);
        setLoadFailed(false);
        setRefreshing(false);
        return next;
      } catch (err) {
        console.warn(`Games state attempt ${i + 1} failed:`, err.message);
      }
    }
    setRefreshing(false);
    setLoadFailed(true);
    return null;
  }, [gameId, userId]);

  useEffect(() => { load({ reset: true }); }, [load]);

  const handleStart = useCallback(async () => {
    setBusy('starting');
    try {
      const res = await startGameTry(gameId, userId, userName);
      setTryId(res.tryId);
      setState(s => (s ? { ...s, triesLeft: res.triesLeft, triesUsed: s.maxTries - res.triesLeft } : s));
      return true;
    } catch (err) {
      showToast?.(err.status === 429 ? "You've used all 3 tries today." : "The game didn't start. Please press Start again.", err.status === 429 ? 'info' : 'error');
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
    setBusy('saving');
    // Show the new best right away; the server response confirms it.
    setState(s => (s ? { ...s, bestToday: Math.max(s.bestToday || 0, score) } : s));
    let saved = null;
    for (let i = 0; i < 2 && !saved; i++) {
      try {
        saved = await finishGameTry(gameId, userId, id, score);
      } catch (err) {
        console.warn(`Games finish attempt ${i + 1} failed:`, err.message);
        if (err.status && err.status < 500) break; // rejected, retrying will not help
        await new Promise(r => setTimeout(r, 800));
      }
    }
    setBusy(false);
    if (!saved) {
      showToast?.("That score couldn't be saved, so it won't count on the leaderboard.", 'info');
      load();
    } else if (saved.state) {
      setState(saved.state);
    } else {
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

          {!state ? (
            <div className="games-waiting" role="status">
              <span className="games-spinner" aria-hidden="true" />
              <p>{loadFailed ? 'Still connecting to the game. This can take a few seconds after a quiet period.' : 'Loading your tries…'}</p>
              {loadFailed && <button type="button" className="btn-secondary" onClick={() => load()}>Retry now</button>}
            </div>
          ) : (
            <>
              <GameComponent triesLeft={triesLeft} onStart={handleStart} onFinish={handleFinish} busy={busy} />
              <p className="games-best" aria-live="polite">
                {busy === 'saving' ? 'Saving your score…' : refreshing ? 'Updating the leaderboard…' : state.bestToday > 0 ? <>Your best today: <strong>{state.bestToday}</strong></> : '\u00A0'}
              </p>
            </>
          )}
        </section>

        <Leaderboard state={state} userId={userId} />
      </div>
    </div>
  );
}
