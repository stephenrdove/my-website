import { useState, useEffect } from 'react';
import { drawCards, type DrawnCard } from './cards';
import LandingView from './components/LandingView';
import CardSpread from './components/CardSpread';

// ── Constants ─────────────────────────────────────────────────────────────

const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? '';
const KEY_DATE    = 'tarot:lastReading';
const KEY_READING = 'tarot:cachedReading';
const KEY_CARDS   = 'tarot:cachedCards';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ── Countdown helper ──────────────────────────────────────────────────────

function useCountdown() {
  const [label, setLabel] = useState('');

  useEffect(() => {
    function tick() {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const ms = midnight.getTime() - now.getTime();
      const h  = Math.floor(ms / 3_600_000);
      const m  = Math.floor((ms % 3_600_000) / 60_000);
      const s  = Math.floor((ms % 60_000) / 1_000);
      setLabel(`${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return label;
}

// ── Phase type ────────────────────────────────────────────────────────────

type Phase = 'landing' | 'drawing' | 'loading' | 'reading' | 'done';

// ── App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [phase, setPhase]               = useState<Phase>('landing');
  const [cards, setCards]               = useState<DrawnCard[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [reading, setReading]           = useState('');
  const [error, setError]               = useState('');
  const countdown                       = useCountdown();

  // On mount: check for ?reset=1, then check localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === '1') {
      localStorage.removeItem(KEY_DATE);
      localStorage.removeItem(KEY_READING);
      localStorage.removeItem(KEY_CARDS);
      window.history.replaceState({}, '', window.location.pathname);
    }

    const lastDate = localStorage.getItem(KEY_DATE);
    if (lastDate === todayISO()) {
      const cachedReading = localStorage.getItem(KEY_READING) ?? '';
      const cachedCards   = JSON.parse(localStorage.getItem(KEY_CARDS) ?? '[]') as DrawnCard[];
      setReading(cachedReading);
      setCards(cachedCards);
      setRevealedCount(3);
      setPhase('done');
    }
  }, []);

  // ── Draw handler ────────────────────────────────────────────────────────

  function handleDraw() {
    const drawn = drawCards(3);
    setCards(drawn);
    setRevealedCount(0);
    setError('');
    setPhase('drawing');

    // Staggered card reveal
    setTimeout(() => setRevealedCount(1), 300);
    setTimeout(() => setRevealedCount(2), 900);
    setTimeout(() => setRevealedCount(3), 1500);

    // Fetch reading after cards finish revealing
    setTimeout(() => fetchReading(drawn), 2100);
  }

  // ── Reading fetch ───────────────────────────────────────────────────────

  async function fetchReading(drawn: DrawnCard[]) {
    setPhase('loading');

    const positions = ['Past', 'Present', 'Future'] as const;
    const payload = {
      cards: drawn.map((c, i) => ({
        name:        c.name,
        position:    positions[i],
        orientation: c.isReversed ? 'reversed' : 'upright',
        meaning:     c.isReversed ? c.reversedMeaning : c.upright,
      })),
    };

    try {
      const res = await fetch(`${WORKER_URL}/reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json() as { reading: string };

      // Strip any markdown headers the model may have added
      const cleaned = data.reading
        .replace(/^#+\s.*\n?/gm, '')  // remove # Header lines
        .trim();

      setReading(cleaned);
      localStorage.setItem(KEY_DATE,    todayISO());
      localStorage.setItem(KEY_READING, data.reading);
      localStorage.setItem(KEY_CARDS,   JSON.stringify(drawn));
      setPhase('reading');
    } catch {
      setError('The cards were unclear. Please try again later.');
      setPhase('reading');
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (phase === 'landing') {
    return (
      <div className="app">
        <SiteHeader />
        <LandingView onDraw={handleDraw} />
      </div>
    );
  }

  const showLoading = phase === 'loading';
  const showReading = phase === 'reading' || phase === 'done';
  const showDone    = phase === 'done';

  return (
    <div className="app">
      <SiteHeader />
      <div className="reading-page">
        <CardSpread cards={cards} revealedCount={revealedCount} />

        {showLoading && (
          <div className="reading-section">
            <Divider />
            <p className="reading-loading">
              <span className="loading-dots">Reading the cards</span>
            </p>
          </div>
        )}

        {showReading && (
          <div className="reading-section">
            <Divider />
            {error ? (
              <p className="reading-error">{error}</p>
            ) : (
              <>
                <h2 className="reading-title">Your Reading</h2>
                <div className="reading-text">
                  {reading.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {showDone && (
          <div className="done-banner">
            <p className="done-banner-title">Today's reading is complete</p>
            <p className="done-banner-msg">Come back tomorrow for a new spread.</p>
            <span className="countdown">{countdown} until midnight</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small shared components ───────────────────────────────────────────────

function SiteHeader() {
  return (
    <header className="site-header">
      <a href="/" className="back-link">← stephendove.com</a>
    </header>
  );
}

function Divider() {
  return (
    <div className="divider">
      <span className="divider-symbol">✦</span>
    </div>
  );
}
