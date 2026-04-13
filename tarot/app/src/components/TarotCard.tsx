import { SUIT_SYMBOL, type DrawnCard } from '../cards';

const POSITIONS = ['Past', 'Present', 'Future'] as const;

interface Props {
  card: DrawnCard;
  index: number;
  revealed: boolean;
}

export default function TarotCard({ card, index, revealed }: Props) {
  const symbol = SUIT_SYMBOL[card.suit ?? 'major'];
  const suitLabel = card.arcana === 'major' ? 'Major Arcana' : card.suit!;

  return (
    <div className={`card-slot${revealed ? ' revealed' : ''}`}>
      <span className="card-position">{POSITIONS[index]}</span>

      <div className={`card-rect${card.isReversed ? ' reversed' : ''}`}>
        <span className="card-symbol">{symbol}</span>
        <span className="card-suit-label">{suitLabel}</span>
      </div>

      <div className="card-info">
        <div className="card-name">{card.name}</div>
        {card.isReversed && (
          <div className="card-reversed-badge">Reversed</div>
        )}
        <div className="card-keywords">
          {card.keywords.slice(0, 3).map(k => (
            <span key={k} className="keyword-tag">{k}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
