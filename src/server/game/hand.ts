/**
 * @brief Representation for Cribbage-specific hand.
 */
import { Card, Suit } from './cards';
import { PowerSet } from 'js-combinatorics';
import { Util } from './util';

/**
 * @brief Represents a hand of cards.
 */
export class Hand {
    private readonly cards: Card[];

    public constructor(
        private readonly handCards: Card[],
        private readonly cutCard: Card | null = null,
        private readonly crib: boolean = false,
    ) {
        if (cutCard) {
            this.cards = [...handCards, cutCard];
        } else {
            this.cards = [...handCards];
        }
        this.cards.forEach((card) => {
            if (!(card instanceof Card)) {
                throw new Error(`Illegal value ("${card}")`);
            }
        });
    }

    /**
     * @brief Returns the point count for the hand.
     */
    public readonly count = (verbose = false) => {
        let points = 0;

        // all possible subsets of cards within the hand
        const subsets: Card[][] = [...new PowerSet(this.cards)];

        subsets.forEach((subset) => {
            const subsetRanks = subset.map((card) => {
                return card.rank;
            });
            const subsetValues = subset.map((card) => {
                return card.value;
            });
            const cardRanks = this.cards.map((card) => {
                return card.rank;
            });

            // count fifteens
            if (
                subsetValues.reduce((total, value) => {
                    return total + value;
                }, 0) === 15
            ) {
                Util.log(verbose, 'fifteen');
                points += 2;
            }

            // count pairs
            if (subset.length === 2 && subsetRanks[0] === subsetRanks[1]) {
                Util.log(verbose, 'pair');
                points += 2;
            }

            // count runs
            const smallestRank = Math.min(...subsetRanks);
            const checkRun = (runLength: number) => {
                return subsetRanks.some((rank) => {
                    return rank === smallestRank + runLength;
                });
            };
            let runLength = 1;
            while (checkRun(runLength)) {
                runLength += 1;
            }
            if (
                runLength >= 3 &&
                runLength === subset.length &&
                cardRanks.every((rank) => {
                    return (
                        rank !== smallestRank + runLength &&
                        rank !== smallestRank - 1
                    );
                })
            ) {
                Util.log(verbose, `run of ${runLength}`);
                points += runLength;
            }
        });

        // count flushes
        const flushSuit = Suit.SUITS.find((suit) => {
            return this.handCards.every((card) => {
                return card.suit === suit;
            });
        });
        const cutMatches = this.cutCard?.suit === flushSuit;
        const flushPoints = cutMatches
            ? this.cards.length
            : !this.crib && flushSuit
            ? this.cards.length - 1
            : 0;
        if (flushPoints > 0) {
            Util.log(verbose, `${flushPoints}-card flush`);
            points += flushPoints;
        }

        // count nob
        if (
            this.handCards.some((card) => {
                return card.rank === 11 && card.suit === this.cutCard?.suit;
            })
        ) {
            Util.log(verbose, 'nob');
            points += 1;
        }

        return points;
    };

    public readonly toString = () => {
        return `Hand: [${this.handCards.join(', ')}${
            this.cutCard ? ` | ${this.cutCard}` : ''
        }${this.crib ? ' | crib' : ''}]`;
    };
}
