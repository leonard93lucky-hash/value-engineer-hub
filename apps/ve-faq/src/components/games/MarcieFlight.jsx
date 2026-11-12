import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Marcie's flight: tap (or press Space / Arrow up) to flap and fly Marcie
 * through the gaps between the towers. One point per tower passed.
 *
 * The parent owns tries and scores: `onStart()` must resolve to true before a run begins,
 * and `onFinish(score)` is called once when Marcie crashes.
 */

const W = 420;            // logical canvas size (scaled with CSS)
const H = 600;
const GROUND = 56;        // ground strip height
const BIRD_X = 110;
const BIRD_R = 17;        // collision radius
const GRAVITY = 1500;     // px / s²
const FLAP = -440;        // px / s
const TOWER_W = 70;
const SPACING = 230;      // px between towers
const START_SPEED = 165;  // px / s
const MAX_SPEED = 255;
const START_GAP = 175;
const MIN_GAP = 135;

const C = {
  sky: '#F7F5F2',
  cloud: '#FFFFFF',
  hill: '#F2E8DD',
  tower: '#F2DADF',
  towerEdge: '#430A23',
  band: '#E60034',
  ground: '#430A23',
  groundTop: '#66545E',
  text: '#430A23',
};

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function newWorld() {
  return {
    birdY: H / 2 - 40,
    vel: 0,
    towers: [],
    score: 0,
    speed: START_SPEED,
    gap: START_GAP,
    distance: 0,
    clouds: [
      { x: 60, y: 90, s: 1 }, { x: 260, y: 150, s: 0.8 }, { x: 380, y: 70, s: 1.2 },
    ],
    t: 0,
  };
}

function addTower(world, x) {
  const top = 70;
  const bottom = H - GROUND - 70;
  const gapY = top + Math.random() * (bottom - top - world.gap);
  world.towers.push({ x, gapY, passed: false });
}

/**
 * Marcie seen from the side, facing right, drawn with canvas shapes (about 64×52 px).
 * Same character as the chat icon: brown owl, aviator cap with goggles, red scarf, closed happy eye.
 * `wing` goes from -1 (wing up, just flapped) to 1 (wing down); `t` animates the scarf tail.
 */
function drawMarcieSide(ctx, t, wing) {
  const BROWN = '#9A6A48', DARK = '#6B4430', WING = '#7E5539', CREAM = '#F7EBDD';
  const RED = '#E60034', RED_DARK = '#C9002E', INK = '#430A23', LENS = '#CDEBF5', BEAK = '#F5A623', BLUSH = '#F28BA0';

  // Scarf tail streaming behind
  const wave = Math.sin(t * 14) * 4;
  ctx.fillStyle = RED_DARK;
  ctx.beginPath();
  ctx.moveTo(-10, 8);
  ctx.quadraticCurveTo(-24, 6 + wave, -34, 10 + wave * 1.4);
  ctx.lineTo(-33, 17 + wave * 1.4);
  ctx.quadraticCurveTo(-22, 14 + wave, -9, 15);
  ctx.closePath();
  ctx.fill();

  // White sticker outline behind the body
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.ellipse(0, 1, 25, 23, 0, 0, Math.PI * 2); ctx.fill();

  // Feet tucked under
  ctx.strokeStyle = BEAK; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-3, 19); ctx.lineTo(-6, 25); ctx.moveTo(4, 19); ctx.lineTo(2, 25); ctx.stroke();

  // Body
  ctx.fillStyle = BROWN;
  ctx.beginPath(); ctx.ellipse(0, 1, 22, 20, 0, 0, Math.PI * 2); ctx.fill();

  // Belly
  ctx.fillStyle = CREAM;
  ctx.beginPath(); ctx.ellipse(8, 9, 12, 10, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#C9A98E'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(6, 9, 2.5, 0.2, Math.PI - 0.2); ctx.arc(12, 11, 2.5, 0.2, Math.PI - 0.2); ctx.stroke();

  // Face disc
  ctx.fillStyle = CREAM;
  ctx.beginPath(); ctx.ellipse(11, -4, 11, 11, 0, 0, Math.PI * 2); ctx.fill();

  // Scarf around the neck
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.moveTo(-14, 5); ctx.quadraticCurveTo(2, 12, 20, 6);
  ctx.lineTo(19, 11); ctx.quadraticCurveTo(2, 18, -13, 11);
  ctx.closePath(); ctx.fill();

  // Aviator cap
  ctx.fillStyle = DARK;
  ctx.beginPath();
  ctx.moveTo(-19, -6);
  ctx.bezierCurveTo(-18, -26, 14, -30, 21, -12);
  ctx.quadraticCurveTo(4, -15, -19, -6);
  ctx.closePath(); ctx.fill();
  // Ear flap
  ctx.beginPath(); ctx.ellipse(-12, -2, 6, 9, 0.2, 0, Math.PI * 2); ctx.fill();

  // Goggles on the cap (one lens visible from the side)
  ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-17, -12); ctx.quadraticCurveTo(-4, -20, 4, -19); ctx.stroke();
  ctx.fillStyle = LENS; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(9, -19, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(9, -19, 3.5, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();

  // Closed happy eye
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(13, -3, 4, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();

  // Blush
  ctx.fillStyle = BLUSH;
  ctx.beginPath(); ctx.ellipse(12, 3, 3.5, 2, 0, 0, Math.PI * 2); ctx.fill();

  // Beak
  ctx.fillStyle = BEAK;
  ctx.beginPath(); ctx.moveTo(20, -3); ctx.lineTo(28, 1); ctx.lineTo(20, 4); ctx.closePath(); ctx.fill();

  // Wing (flaps around its shoulder)
  ctx.save();
  ctx.translate(-4, 0);
  ctx.rotate(wing * 0.9);
  ctx.fillStyle = WING;
  ctx.beginPath(); ctx.ellipse(-6, 4, 12, 7, -0.25, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = DARK; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-14, 5); ctx.quadraticCurveTo(-8, 8, -1, 7); ctx.stroke();
  ctx.restore();
}

export default function MarcieFlight({ triesLeft, onStart, onFinish, busy }) {
  const canvasRef = useRef(null);
  const worldRef = useRef(null); // set in an effect / on start, mutated every frame
  const phaseRef = useRef('ready'); // 'ready' | 'playing' | 'over'
  const rafRef = useRef(0);
  const onFinishRef = useRef(onFinish);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);
  const [phase, setPhase] = useState('ready');
  const [score, setScore] = useState(0);
  const [lastScore, setLastScore] = useState(null);
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = worldRef.current;
    if (!w) return;

    // Sky
    ctx.fillStyle = C.sky;
    ctx.fillRect(0, 0, W, H);

    // Clouds
    ctx.fillStyle = C.cloud;
    for (const c of w.clouds) {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 34 * c.s, 16 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + 24 * c.s, c.y - 8 * c.s, 24 * c.s, 14 * c.s, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hills
    ctx.fillStyle = C.hill;
    const hillShift = -(w.distance * 0.25) % 240;
    for (let i = -1; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(hillShift + i * 240 + 120, H - GROUND, 150, 70, 0, Math.PI, 0);
      ctx.fill();
    }

    // Towers
    for (const t of w.towers) {
      const gapBottom = t.gapY + w.gap;
      ctx.lineWidth = 3;
      ctx.strokeStyle = C.towerEdge;
      ctx.fillStyle = C.tower;
      roundRect(ctx, t.x, -20, TOWER_W, t.gapY + 20, 12);
      ctx.fill(); ctx.stroke();
      roundRect(ctx, t.x, gapBottom, TOWER_W, H - GROUND - gapBottom + 20, 12);
      ctx.fill(); ctx.stroke();
      // Red bands at the openings
      ctx.fillStyle = C.band;
      roundRect(ctx, t.x - 6, t.gapY - 18, TOWER_W + 12, 18, 6);
      ctx.fill(); ctx.stroke();
      roundRect(ctx, t.x - 6, gapBottom, TOWER_W + 12, 18, 6);
      ctx.fill(); ctx.stroke();
    }

    // Ground
    ctx.fillStyle = C.ground;
    ctx.fillRect(0, H - GROUND, W, GROUND);
    ctx.fillStyle = C.groundTop;
    const stripe = -(w.distance % 32);
    for (let x = stripe; x < W; x += 32) ctx.fillRect(x, H - GROUND + 10, 16, 4);

    // Marcie (side view). Wing snaps up on a flap, then settles; idle bob on the start screen.
    const playing = phaseRef.current === 'playing';
    const angle = playing ? Math.max(-0.45, Math.min(1.1, w.vel / 600)) : 0;
    const sinceFlap = w.t - (w.flapAt ?? -1);
    const wing = playing
      ? (sinceFlap < 0.12 ? -1 : Math.min(1, -1 + (sinceFlap - 0.12) * 8))
      : Math.sin(w.t * 6) * 0.8;
    ctx.save();
    ctx.translate(BIRD_X, w.birdY);
    ctx.rotate(angle);
    ctx.scale(1.2, 1.2);
    drawMarcieSide(ctx, w.t, wing);
    ctx.restore();

    // Score
    if (phaseRef.current !== 'ready') {
      ctx.fillStyle = C.text;
      ctx.font = '600 44px "Google Sans", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(w.score), W / 2, 72);
    }
  }, []);

  const endRun = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    phaseRef.current = 'over';
    cancelAnimationFrame(rafRef.current);
    const final = worldRef.current.score;
    setPhase('over');
    setLastScore(final);
    draw();
    onFinishRef.current?.(final);
  }, [draw]);

  const step = useCallback((dt) => {
    const w = worldRef.current;
    w.t += dt;
    w.vel += GRAVITY * dt;
    w.birdY += w.vel * dt;
    w.distance += w.speed * dt;

    if (!reducedMotion) {
      for (const c of w.clouds) {
        c.x -= w.speed * 0.15 * dt;
        if (c.x < -80) { c.x = W + 60; c.y = 50 + Math.random() * 140; }
      }
    }

    for (const t of w.towers) t.x -= w.speed * dt;
    w.towers = w.towers.filter(t => t.x + TOWER_W > -20);
    const last = w.towers[w.towers.length - 1];
    if (!last || last.x < W - SPACING) addTower(w, (last ? last.x : W) + SPACING);

    for (const t of w.towers) {
      if (!t.passed && t.x + TOWER_W < BIRD_X - BIRD_R) {
        t.passed = true;
        w.score += 1;
        setScore(w.score);
        w.speed = Math.min(MAX_SPEED, START_SPEED + w.score * 4);
        w.gap = Math.max(MIN_GAP, START_GAP - w.score * 1.5);
      }
    }

    // Collisions
    if (w.birdY + BIRD_R >= H - GROUND || w.birdY - BIRD_R <= 0) return endRun();
    for (const t of w.towers) {
      const withinX = BIRD_X + BIRD_R > t.x - 4 && BIRD_X - BIRD_R < t.x + TOWER_W + 4;
      if (withinX && (w.birdY - BIRD_R < t.gapY || w.birdY + BIRD_R > t.gapY + w.gap)) return endRun();
    }
  }, [endRun, reducedMotion]);

  const loop = useCallback(() => {
    let prev = performance.now();
    const tick = (now) => {
      const dt = Math.min(1 / 30, (now - prev) / 1000);
      prev = now;
      step(dt);
      draw();
      if (phaseRef.current === 'playing') rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [step, draw]);

  const flap = useCallback(() => {
    if (phaseRef.current === 'playing') { worldRef.current.vel = FLAP; worldRef.current.flapAt = worldRef.current.t; }
  }, []);

  const start = useCallback(async () => {
    if (busy || triesLeft <= 0 || phaseRef.current === 'playing') return;
    const ok = await onStart();
    if (!ok) return;
    worldRef.current = newWorld();
    addTower(worldRef.current, W + 60);
    setScore(0);
    phaseRef.current = 'playing';
    setPhase('playing');
    worldRef.current.vel = FLAP;
    worldRef.current.flapAt = 0;
    canvasRef.current?.focus();
    loop();
  }, [busy, triesLeft, onStart, loop]);

  // Load sprite, draw the first frame
  useEffect(() => {
    if (!worldRef.current) worldRef.current = newWorld();
    draw();
  }, [draw]);

  // Keyboard: Space / Arrow up flaps while playing
  useEffect(() => {
    const onKey = (e) => {
      if (phaseRef.current !== 'playing') return;
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flap(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flap]);

  // Leaving the page mid-run ends the run with the score so far
  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    if (phaseRef.current === 'playing') {
      phaseRef.current = 'over';
      onFinishRef.current?.(worldRef.current.score, { leaving: true });
    }
  }, []);

  const noTries = triesLeft <= 0;

  return (
    <div className="mf-wrap">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="mf-canvas"
        tabIndex={0}
        role="img"
        aria-label={phase === 'playing' ? `Marcie's flight, score ${score}. Press Space to flap.` : "Marcie's flight game"}
        onPointerDown={(e) => { if (phase === 'playing') { e.preventDefault(); flap(); } }}
      />

      {phase !== 'playing' && (
        <div className="mf-overlay">
          {phase === 'over' && lastScore !== null && (
            <p className="mf-result" role="status">Score <strong>{lastScore}</strong></p>
          )}
          {phase === 'ready' && (
            <p className="mf-howto">Tap, click or press Space to flap. Fly through the gaps; each tower is 1 point.</p>
          )}
          {noTries ? (
            <p className="mf-done">You've used all 3 tries today. New tries at 00:00 WIB.</p>
          ) : (
            <button type="button" className="btn-primary mf-start" onClick={start} disabled={busy}>
              {busy === 'starting' ? 'Starting…' : busy === 'saving' ? 'Saving score…' : phase === 'over' ? `Play again (${triesLeft} ${triesLeft === 1 ? 'try' : 'tries'} left)` : `Start (${triesLeft} ${triesLeft === 1 ? 'try' : 'tries'} left)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
