import TarotCard from './TarotCard';
import { type DrawnCard } from '../cards';

interface Props {
  cards: DrawnCard[];
  revealedCount: number;
}

export default function CardSpread({ cards, revealedCount }: Props) {
  return (
    <div>
      <p className="spread-header">Past · Present · Future</p>
      <div className="spread">
        {cards.map((card, i) => (
          <TarotCard
            key={card.id}
            card={card}
            index={i}
            revealed={i < revealedCount}
          />
        ))}
      </div>
    </div>
  );
}
