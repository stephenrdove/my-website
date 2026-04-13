interface Props {
  onDraw: () => void;
}

export default function LandingView({ onDraw }: Props) {
  return (
    <div className="landing-page">
      <div className="landing-inner">
        <span className="landing-glyph">✦</span>
        <h1>Daily Tarot</h1>
        <p className="landing-desc">
          Draw three cards and receive a reading for the day ahead.
          One spread per day — come back tomorrow for a new one.
        </p>
        <button className="btn-draw" onClick={onDraw}>
          Draw your cards
        </button>
      </div>
    </div>
  );
}
