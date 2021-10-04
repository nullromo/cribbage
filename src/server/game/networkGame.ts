import { assertUnreachable } from 'common/util';
import { Card, Deck } from './cards';
import { Hand } from './hand';
import { Player } from './player';
import { Util } from './util';

enum CribbageGameState {
    SETUP,
    AWAIT_THROW_TO_CRIB,
    AWAIT_PLAY,
}

enum PlayerIdentifier {
    DEALER,
    PONE,
}

const otherPlayer = (player: PlayerIdentifier) => {
    switch (player) {
        case PlayerIdentifier.DEALER:
            return PlayerIdentifier.PONE;
        case PlayerIdentifier.PONE:
            return PlayerIdentifier.DEALER;
        default:
            return assertUnreachable(player);
    }
};

export class NetworkCribbageGame {
    private cribCards: Card[] = [];

    private readonly deck = new Deck();

    private gameState = CribbageGameState.SETUP;

    private cutCard: Card | null = null;

    private pendingPoints = {
        cribPoints: 0,
        dealerPoints: 0,
        ponePoints: 0,
    };

    private playedCards: Card[] = [];

    private playerToPlay = PlayerIdentifier.DEALER;

    private passed: PlayerIdentifier | null = null;

    private dealer: Player = new Player('dealer');

    private pone: Player = new Player('pone');

    public constructor() {
        console.log('Welcome to Cribbage.');
        console.log();
        console.log(`${this.dealer.getName()} is the dealer.`);
        console.log(`${this.pone.getName()} is the pone.`);
        console.log('Shuffling deck.');
        this.deck.shuffle();
        console.log('Dealing cards.');
        this.deal(this.deck, this.dealer, this.pone, 6);
        console.log(
            `Waiting for ${this.dealer.getName()} to throw 2 cards to the crib...`,
        );
        this.gameState = CribbageGameState.AWAIT_THROW_TO_CRIB;
    }

    private readonly getActivePlayer = () => {
        return this.getPlayer(this.playerToPlay);
    };

    private readonly getPlayer = (player: PlayerIdentifier) => {
        if (player === PlayerIdentifier.DEALER) {
            return this.dealer;
        }
        return this.pone;
    };

    public readonly throwToCrib = (player: PlayerIdentifier, threw: Card[]) => {
        if (this.gameState !== CribbageGameState.AWAIT_THROW_TO_CRIB) {
            return;
        }
        if (player !== this.playerToPlay) {
            return;
        }

        console.log(
            `${this.getPlayer(player).getName()} threw ${threw} into the crib.`,
        );
        this.cribCards = [...this.cribCards, ...threw];
        this.playerToPlay = PlayerIdentifier.PONE;
        if (player === PlayerIdentifier.DEALER) {
            console.log(
                `Waiting for ${this.pone.getName()} to throw 2 cards to the crib...`,
            );
        } else {
            this.cutCard = this.deck.draw();
            console.log(`The cut card is ${this.cutCard}.`);
            if (this.cutCard.rank === 11) {
                console.log(
                    `${this.dealer.getName()} receives 2 points for the Jack's heels.`,
                );
                this.addPoints(PlayerIdentifier.DEALER, 2);
            }
            this.pendingPoints = {
                cribPoints: new Hand(
                    this.cribCards,
                    this.cutCard,
                    true,
                ).count(),
                dealerPoints: new Hand(
                    this.dealer.getHandCards(),
                    this.cutCard,
                ).count(),
                ponePoints: new Hand(
                    this.pone.getHandCards(),
                    this.cutCard,
                ).count(),
            };
            this.playedCards = [];
            this.playerToPlay = PlayerIdentifier.PONE;
            this.passed = null;
            console.log(
                `Waiting for ${this.getActivePlayer().getName()} to play a card...`,
            );
            this.gameState = CribbageGameState.AWAIT_PLAY;
        }
    };

    public readonly play = (player: PlayerIdentifier, playedCard: Card) => {
        if (this.gameState !== CribbageGameState.AWAIT_PLAY) {
            return;
        }
        if (player !== this.playerToPlay) {
            return;
        }

        console.log(`${this.getActivePlayer().getName()} plays ${playedCard}.`);
        this.playedCards.push(playedCard);
        console.log(
            `Cards in play: ${this.playedCards} (${this.playedCards
                .map((card) => {
                    return card.value;
                })
                .reduce((total, next) => {
                    return total + next;
                }, 0)}).`,
        );
        const pegPoints = this.countPegPoints();
        if (pegPoints !== 0) {
            console.log(
                `${this.getActivePlayer().getName()} pegs ${pegPoints} points.`,
            );
            this.addPoints(this.playerToPlay, pegPoints);
        }
        if (
            this.dealer.getHandCards().length === 0 &&
            this.pone.getHandCards().length === 0
        ) {
            console.log(`${this.getActivePlayer().getName()} receives a go.`);
            this.addPoints(this.playerToPlay, 1);
            console.log(
                `${this.pone.getName()} counts ${
                    this.pendingPoints.ponePoints
                } points.`,
            );
            this.addPoints(
                PlayerIdentifier.PONE,
                this.pendingPoints.ponePoints,
            );
            console.log(
                `${this.dealer.getName()} counts ${
                    this.pendingPoints.dealerPoints
                } points.`,
            );
            this.addPoints(
                PlayerIdentifier.DEALER,
                this.pendingPoints.dealerPoints,
            );
            console.log(
                `${this.dealer.getName()} scores ${
                    this.pendingPoints.cribPoints
                } points from the crib.`,
            );
            this.addPoints(
                PlayerIdentifier.DEALER,
                this.pendingPoints.cribPoints,
            );
            [this.dealer, this.pone] = [this.pone, this.dealer];
            this.gameState = CribbageGameState.AWAIT_THROW_TO_CRIB;
            this.playerToPlay = PlayerIdentifier.DEALER;
        } else if (!this.passed) {
            this.playerToPlay = otherPlayer(this.playerToPlay);
        }
    };

    public readonly pass = (player: PlayerIdentifier) => {
        if (this.gameState !== CribbageGameState.AWAIT_PLAY) {
            return;
        }
        if (player !== this.playerToPlay) {
            return;
        }

        if (!this.passed) {
            console.log(
                `${this.getActivePlayer().getName()} cannot play a card.`,
            );
            this.passed = player;
            this.playerToPlay = otherPlayer(player);
        } else {
            this.passed = null;
            console.log(`${this.getActivePlayer().getName()} receives a go.`);
            this.addPoints(this.playerToPlay, 1);
            this.playerToPlay = otherPlayer(this.playerToPlay);
            this.playedCards = [];
        }
    };

    private readonly countPegPoints = (verbose = false) => {
        let points = 0;
        const count = this.playedCards
            .map((card) => {
                return card.value;
            })
            .reduce((total, next) => {
                return total + next;
            }, 0);

        // count for 15
        if (count == 15) {
            Util.log(verbose, 'fifteen');
            points += 2;
        }

        // count for 31
        if (count == 31) {
            Util.log(verbose, 'thirty-one');
            points += 1;
        }

        // count for pairs
        const additionFactorial = (value: number) => {
            let result = 0;
            [...Array(value).keys()].forEach((i) => {
                result += i + 1;
            });
            return result;
        };
        let pairs = 0;
        for (const i of [
            ...Array(Math.max(this.playedCards.length - 1, 0)).keys(),
        ].reverse()) {
            if (
                this.playedCards[i].rank ===
                this.playedCards[this.playedCards.length - 1].rank
            ) {
                pairs += 1;
            } else {
                break;
            }
        }
        if (pairs > 0) {
            Util.log(verbose, `${pairs} pair${pairs !== 1 ? 's' : ''}`);
        }
        points += 2 * additionFactorial(pairs);

        // count for runs
        const runExists = (cards: Card[]) => {
            cards.sort((a, b) => {
                return a.rank - b.rank;
            });
            let run = 0;
            for (const i of [...Array(cards.length - 1).keys()]) {
                if (cards[i].rank + 1 != cards[i + 1].rank) {
                    break;
                }
                run += 1;
            }
            return run === cards.length - 1;
        };
        let runLength = 0;
        [...Array(this.playedCards.length + 1).keys()].slice(1).forEach((i) => {
            const lastICards = this.playedCards.slice(
                this.playedCards.length - i,
            );
            if (runExists(lastICards)) {
                runLength = i;
            }
        });
        if (runLength >= 3) {
            Util.log(verbose, `run of ${runLength}`);
            points += runLength;
        }

        return points;
    };

    private readonly reportScore = () => {
        return `[${this.dealer.getName()} [${this.dealer.getPoints()}|${this.pone.getPoints()}] ${this.pone.getName()}]`;
    };

    private readonly addPoints = (
        player: PlayerIdentifier,
        points: number,
        report = true,
    ) => {
        (player === PlayerIdentifier.DEALER
            ? this.dealer
            : this.pone
        ).addPoints(points);
        if (report) {
            console.log(`The score is now ${this.reportScore()}`);
        }
        this.checkWin();
    };

    private readonly checkWin = () => {
        let winner = null;
        if (this.dealer.getPoints() >= 121) {
            winner = this.dealer;
        } else if (this.pone.getPoints() >= 121) {
            winner = this.pone;
        }

        if (winner) {
            console.log();
            console.log(`${this.dealer.getName()} wins`);
            console.log(`Final score: ${this.reportScore()}`);
            process.exit(0);
        }
    };

    private readonly deal = (
        deck: Deck,
        player1: Player,
        player2: Player,
        amount: number,
    ) => {
        const hand1cards: Card[] = [];
        const hand2cards: Card[] = [];
        [...Array(amount)].forEach(() => {
            hand1cards.push(deck.draw());
            hand2cards.push(deck.draw());
        });
        player1.setHandCards(hand1cards);
        player2.setHandCards(hand2cards);
    };
}
