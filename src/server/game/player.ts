/**
 * Representations for Players
 */
import { Card, Suit } from './cards';
import prompts from 'prompts';
import { Socket } from 'socket.io';
import { serverEventNames } from 'common/events';

/**
 * @brief Given a list of played cards, tells whether the given card is
 * playable or not.
 */
const checkPlayable = (card: Card, playedCards: Card[]) => {
    const count = playedCards
        .map((card) => {
            return card.value;
        })
        .reduce((total, next) => {
            return total + next;
        }, 0);
    return count + card.value <= 31;
};

class PlayerBase {
    private points;

    protected handCards: Card[];

    public constructor(private readonly name: string) {
        this.points = 0;
        this.handCards = [
            new Card(Suit.HEARTS, 1),
            new Card(Suit.CLUBS, 4),
            new Card(Suit.SPADES, 2),
            new Card(Suit.SPADES, 10),
            new Card(Suit.SPADES, 13),
        ];
    }

    public readonly getPoints = () => {
        return this.points;
    };

    public readonly addPoints = (points: number) => {
        this.points += points;
    };

    public readonly getName = () => {
        return this.name;
    };

    public readonly setHandCards = (cards: Card[]) => {
        this.handCards = [...cards];
    };

    public readonly getHandCards = () => {
        return [...this.handCards];
    };

    public readonly toString = () => {
        return `${this.name} ${this.handCards} (${this.points})`;
    };
}

/**
 * @brief Represents a player in the game.
 *
 * The base player just makes random decisions for throwToCrib() and playCard().
 */
export class Player extends PlayerBase {
    /**
     * @brief Takes 2 cards out of self.hand_cards and returns them as a list.
     */
    /* eslint-disable-next-line @typescript-eslint/require-await */
    public readonly throwToCrib = async (_: boolean) => {
        if (this.handCards.length < 2) {
            throw new Error(
                'Fatal error: Hand contained fewer than 2 cards when throwToCrib was called.',
            );
        }
        return [this.handCards.pop(), this.handCards.pop()] as Card[];
    };

    /**
     * @brief Removes and returns a card from self.hand_cards if there is a
     * playable card. Otherwise, returns null (go).
     */
    /* eslint-disable-next-line @typescript-eslint/require-await */
    public readonly playCard = async (playedCards: Card[]) => {
        const playableCardIndex = this.handCards.findIndex((card) => {
            return checkPlayable(card, playedCards);
        });
        if (playableCardIndex === -1) {
            return null;
        }
        const [removedCard] = this.handCards.splice(playableCardIndex, 1);
        return removedCard;
    };
}

/**
 * @brief Player that takes decisions from stdin.
 */
export class ConsolePlayer extends Player {
    /**
     * @brief Allows a card to be selected from the player's hand.
     */
    public readonly selectCard = async () => {
        console.log('Enter a number to select the corresponding card.');
        console.log(`${this.handCards}`);
        [true, false].forEach((arrow) => {
            this.handCards.forEach((card, i) => {
                if (card.rank == 10) {
                    process.stdout.write(' ');
                }
                process.stdout.write(`${arrow ? '^' : `${i + 1}`}  `);
            });
            console.log();
        });
        const index: number = (
            await prompts({
                message: 'Choose',
                name: 'index',
                type: 'number',
                validate: (value: number) => {
                    return (
                        (value >= 1 && value <= this.handCards.length) ||
                        `Please enter a number between 1 and ${this.handCards.length}`
                    );
                },
            })
        ).index;
        const selectedCard = this.handCards[index - 1];
        this.handCards.splice(index - 1, 1);
        return selectedCard;
    };

    public readonly throwToCrib = async (dealer: boolean) => {
        const cardsToThrow: Card[] = [];
        console.log(
            `Throw 2 cards into your ${dealer ? '' : "opponent's"} crib.`,
        );
        for (const cardName of ['first', 'second']) {
            console.log();
            console.log(`Throw the ${cardName} card.`);
            /* eslint-disable-next-line no-await-in-loop */
            cardsToThrow.push(await this.selectCard());
        }
        console.log();
        return cardsToThrow;
    };

    public readonly playCard = async (
        playedCards: Card[],
    ): Promise<Card | null> => {
        for (const card of this.handCards) {
            if (checkPlayable(card, playedCards)) {
                console.log();
                console.log('Play a card.');
                /* eslint-disable-next-line no-await-in-loop */
                const selectedCard = await this.selectCard();
                if (checkPlayable(selectedCard, playedCards)) {
                    return selectedCard;
                }
                console.log(
                    `${selectedCard} is not playable. Select a different card.`,
                );
                this.handCards.push(selectedCard);
                return this.playCard(playedCards);
            }
        }
        console.log('No playable cards left.');
        return null;
    };
}

export class SocketPlayer extends PlayerBase {
    public constructor(name: string, private readonly socket: Socket) {
        super(name);
    }

    public readonly getSocketID = () => {
        return this.socket.id;
    };

    public readonly on = (
        eventName: keyof typeof serverEventNames,
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        handler: (params: any) => void,
    ) => {
        return this.socket.on(eventName, handler);
    };
}
