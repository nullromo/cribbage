/**
 * @brief Representations for cards and decks.
 */
import { Util } from './util';

/**
 * @brief Represents a card's suit.
 *
 * The Suit.SUITS array contains all the possible values for suits.
 */
export class Suit {
    public static readonly SPADES = new Suit('♠', 'SPADES');

    public static readonly HEARTS = new Suit('♥', 'HEARTS');

    public static readonly DIAMONDS = new Suit('♦', 'DIAMONDS');

    public static readonly CLUBS = new Suit('♣', 'CLUBS');

    public static readonly SUITS = Object.freeze([
        Suit.SPADES,
        Suit.HEARTS,
        Suit.DIAMONDS,
        Suit.CLUBS,
    ]);

    public static readonly randomSuit = () => {
        return Util.arraySample(Suit.SUITS);
    };

    private constructor(
        public readonly icon: string,
        public readonly name: string,
    ) {}

    public readonly toString = () => {
        return `${this.icon} (${this.name})`;
    };

    public readonly equals = (suit: Suit) => {
        return this.icon === suit.icon && this.name === suit.name;
    };
}

/**
 * @brief All possible ranks for cards.
 */
type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

/**
 * @brief Ranks enum.
 *
 * These are the actual runtime values for all the possible ranks.
 */
const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

/**
 * @brief Represents a card. Requires a suit and a rank.
 */
export class Card {
    public readonly value: number;

    public constructor(public readonly suit: Suit, public readonly rank: Rank) {
        if (
            !Suit.SUITS.some((s) => {
                return s.equals(suit);
            })
        ) {
            throw new Error(`Illegal suit (${suit.icon}, ${suit.name})`);
        }
        if (!(rank >= 1 && rank <= 13)) {
            throw new Error(`Illegal rank ("${rank}")`);
        }
        this.value = Math.min(rank, 10);
    }

    public readonly toString = () => {
        return `${(() => {
            switch (this.rank) {
                case 1:
                    return 'A';
                case 11:
                    return 'J';
                case 12:
                    return 'Q';
                case 13:
                    return 'K';
                default:
                    return `${this.rank}`;
            }
        })()}${this.suit.icon}`;
    };
}

/**
 * @brief Represents a deck of cards.
 */
export class Deck {
    private cards = Suit.SUITS.flatMap((suit) => {
        return RANKS.map((rank) => {
            return new Card(suit, rank);
        });
    });

    public readonly isEmpty = () => {
        return this.cards.length <= 0;
    };

    public readonly draw = () => {
        if (this.isEmpty()) {
            throw new Error('Cannot draw from an empty deck');
        } else {
            return this.cards.pop() as Card;
        }
    };

    public readonly shuffle = () => {
        this.cards = Util.arrayShuffle(this.cards);
    };

    public readonly toString = () => {
        return `Deck: ${this.cards.map((card) => {
            return card.toString();
        })}`;
    };
}
