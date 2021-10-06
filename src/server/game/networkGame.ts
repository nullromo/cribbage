import chalk from 'chalk';
import { GameState } from '../../common/gameState';
import { clientEventNames, serverEventNames } from '../../common/events';
import { assertUnreachable } from '../../common/util';
import { Card, Deck } from './cards';
import { Hand } from './hand';
import { SocketPlayer } from './player';
import { Util } from './util';

enum PlayerIdentifier {
    DEALER = 'dealer',
    PONE = 'pone',
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
    private readonly gameLog: string[] = [];

    private cribCards: Card[] = [];

    private deck = new Deck();

    private gameState = GameState.SETUP;

    private cutCard: Card | null = null;

    private pendingPoints = {
        cribPoints: 0,
        dealerPoints: 0,
        ponePoints: 0,
    };

    private playedCards: Card[] = [];

    private playerToPlay = PlayerIdentifier.DEALER;

    private passed: PlayerIdentifier | null = null;

    private dealer: SocketPlayer | null = null;

    private pone: SocketPlayer | null = null;

    private readonly sendStateToPlayers = () => {
        this.dealer?.emit(clientEventNames.GAME_STATE_UPDATE, {
            hand: this.dealer.getHandCards(),
            log: this.gameLog,
            playedCards: this.playedCards,
            score: {
                opponent: this.pone?.getPoints() ?? 0,
                you: this.dealer.getPoints(),
            },
            turn: {
                state: this.gameState,
                you: this.playerToPlay === PlayerIdentifier.DEALER,
            },
        });
        this.pone?.emit(clientEventNames.GAME_STATE_UPDATE, {
            hand: this.pone.getHandCards(),
            log: this.gameLog,
            playedCards: this.playedCards,
            score: {
                opponent: this.dealer?.getPoints() ?? 0,
                you: this.pone.getPoints(),
            },
            turn: {
                state: this.gameState,
                you: this.playerToPlay === PlayerIdentifier.PONE,
            },
        });
    };

    private readonly log = (message?: string) => {
        console.log(`Logged: ${chalk.blueBright(message ?? '')}`);
        this.gameLog.push(message ?? '');
        this.sendStateToPlayers();
    };

    public readonly addPlayer = (player: SocketPlayer) => {
        if (!this.dealer) {
            this.log(`Player 1 added: ${player.getName()}.`);
            this.dealer = player;
        } else if (!this.pone) {
            this.log(`Player 2 added: ${player.getName()}.`);
            this.pone = player;
            this.startGame();
        } else {
            this.log('Cannot add more than 2 players.');
        }
        player.on(serverEventNames.THROW_TO_CRIB, ({ thrownCardNumbers }) => {
            console.log(`Got throw to crib event from ${player}`);
            this.throwToCrib(player, thrownCardNumbers);
        });
        player.on(serverEventNames.PLAY, ({ playedCardNumber }) => {
            console.log(`Got play event from ${player}`);
            this.play(player, playedCardNumber);
        });
    };

    private readonly startGame = () => {
        if (!this.dealer || !this.pone) {
            throw new Error('Null player');
        }

        if (Math.random() > 0.5) {
            [this.dealer, this.pone] = [this.pone, this.dealer];
        }
        this.log('Welcome to Cribbage.');
        this.log();
        this.log(`${this.dealer.getName()} is the dealer.`);
        this.log(`${this.pone.getName()} is the pone.`);
        this.setUpRound();
    };

    private readonly setUpRound = () => {
        if (!this.dealer || !this.pone) {
            throw new Error('Null player');
        }

        this.cribCards = [];
        this.playedCards = [];

        this.log('Shuffling deck.');
        this.deck = new Deck();
        this.deck.shuffle();
        this.log('Dealing cards.');
        this.deal(this.deck, this.dealer, this.pone, 6);
        this.gameState = GameState.AWAIT_THROW_TO_CRIB;
        this.log(
            `Waiting for ${this.dealer.getName()} to throw 2 cards to the crib...`,
        );
    };

    private readonly getActivePlayer = () => {
        return this.getPlayer(this.playerToPlay);
    };

    private readonly getPlayer = (player: PlayerIdentifier) => {
        if (!this.dealer || !this.pone) {
            throw new Error('Null player');
        }

        if (player === PlayerIdentifier.DEALER) {
            return this.dealer;
        }
        return this.pone;
    };

    public readonly throwToCrib = (
        player: SocketPlayer,
        thrownCardNumbers: number[],
    ) => {
        if (this.gameState !== GameState.AWAIT_THROW_TO_CRIB) {
            this.log('You cannot throw cards into the crib right now');
            return;
        }
        if (player !== this.getPlayer(this.playerToPlay)) {
            this.log(`${player.getName()}: it is not your turn.`);
            return;
        }
        if (!this.dealer || !this.pone) {
            throw new Error('Null player');
        }
        if (thrownCardNumbers.length !== 2) {
            this.log('2 cards must be thrown');
            return;
        }
        const handCards = player.getHandCards();
        for (const cardNumber of thrownCardNumbers) {
            if (cardNumber < 0 || cardNumber > handCards.length - 1) {
                this.log('Invalid thrown card');
                return;
            }
        }

        const thrownCards = [
            handCards[thrownCardNumbers[0]],
            handCards[thrownCardNumbers[1]],
        ];

        player.setHandCards(
            handCards.filter((_, i) => {
                return i !== thrownCardNumbers[0] && i !== thrownCardNumbers[1];
            }),
        );

        this.log(`${player.getName()} threw ${thrownCards} into the crib.`);
        this.cribCards = [...this.cribCards, ...thrownCards];
        this.playerToPlay = PlayerIdentifier.PONE;
        if (player === this.getPlayer(PlayerIdentifier.DEALER)) {
            this.log(
                `Waiting for ${this.pone.getName()} to throw 2 cards to the crib...`,
            );
        } else {
            this.cutCard = this.deck.draw();
            this.log(`The cut card is ${this.cutCard}.`);
            if (this.cutCard.rank === 11) {
                this.log(
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
            this.playerToPlay = PlayerIdentifier.PONE;
            this.passed = null;
            this.gameState = GameState.AWAIT_PLAY;
            this.log(
                `Waiting for ${this.getActivePlayer().getName()} to play a card...`,
            );
        }
    };

    public readonly play = (
        player: SocketPlayer,
        playedCardNumber: number | null,
    ) => {
        if (this.gameState !== GameState.AWAIT_PLAY) {
            this.log('You cannot play a card right now');
            return;
        }
        if (player !== this.getPlayer(this.playerToPlay)) {
            this.log(`${player.getName()}: it is not your turn.`);
            return;
        }
        if (!this.dealer || !this.pone) {
            throw new Error('Null player');
        }

        if (playedCardNumber !== null) {
            const handCards = player.getHandCards();
            if (
                playedCardNumber < 0 ||
                playedCardNumber > handCards.length - 1
            ) {
                this.log('Invalid played card');
                return;
            }

            const playedCard = handCards[playedCardNumber];

            player.setHandCards(
                handCards.filter((_, i) => {
                    return i !== playedCardNumber;
                }),
            );

            this.log(
                `${this.getActivePlayer().getName()} plays ${playedCard}.`,
            );
            this.playedCards.push(playedCard);
            this.log(
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
                this.log(
                    `${this.getActivePlayer().getName()} pegs ${pegPoints} points.`,
                );
                this.addPoints(this.playerToPlay, pegPoints);
            }
            if (
                this.dealer.getHandCards().length === 0 &&
                this.pone.getHandCards().length === 0
            ) {
                this.log(`${this.getActivePlayer().getName()} receives a go.`);
                this.addPoints(this.playerToPlay, 1);
                this.log(
                    `${this.pone.getName()} counts ${
                        this.pendingPoints.ponePoints
                    } points.`,
                );
                this.addPoints(
                    PlayerIdentifier.PONE,
                    this.pendingPoints.ponePoints,
                );
                this.log(
                    `${this.dealer.getName()} counts ${
                        this.pendingPoints.dealerPoints
                    } points.`,
                );
                this.addPoints(
                    PlayerIdentifier.DEALER,
                    this.pendingPoints.dealerPoints,
                );
                this.log(
                    `${this.dealer.getName()} scores ${
                        this.pendingPoints.cribPoints
                    } points from the crib.`,
                );
                this.addPoints(
                    PlayerIdentifier.DEALER,
                    this.pendingPoints.cribPoints,
                );
                [this.dealer, this.pone] = [this.pone, this.dealer];
                this.gameState = GameState.AWAIT_THROW_TO_CRIB;
                this.playerToPlay = PlayerIdentifier.DEALER;
                this.setUpRound();
                return;
            }
            if (!this.passed) {
                this.playerToPlay = otherPlayer(this.playerToPlay);
            }
        } else if (!this.passed) {
            this.log(`${this.getActivePlayer().getName()} cannot play a card.`);
            const playerIdentifier =
                this.getPlayer(PlayerIdentifier.DEALER) === player
                    ? PlayerIdentifier.DEALER
                    : PlayerIdentifier.PONE;
            this.passed = playerIdentifier;
            this.playerToPlay = otherPlayer(playerIdentifier);
        } else {
            this.passed = null;
            this.log(`${this.getActivePlayer().getName()} receives a go.`);
            this.playedCards = [];
            this.addPoints(this.playerToPlay, 1);
            this.playerToPlay = otherPlayer(this.playerToPlay);
        }

        const count = this.getCount();
        const activePlayer = this.getActivePlayer();
        if (
            activePlayer.getHandCards().filter((card) => {
                return count + card.value <= 31;
            }).length < 2
        ) {
            const forcedPlayIndex = activePlayer
                .getHandCards()
                .findIndex((card) => {
                    return count + card.value <= 31;
                });
            if (forcedPlayIndex === -1) {
                console.log(`Player ${activePlayer} is forced to pass`);
                this.play(activePlayer, null);
            } else {
                console.log(
                    `Player ${activePlayer} is forced to play index ${forcedPlayIndex} = ${
                        activePlayer.getHandCards()[forcedPlayIndex]
                    }`,
                );
                this.play(activePlayer, forcedPlayIndex);
            }
        }

        this.sendStateToPlayers();
    };

    private readonly getCount = () => {
        return this.playedCards
            .map((card) => {
                return card.value;
            })
            .reduce((total, next) => {
                return total + next;
            }, 0);
    };

    private readonly countPegPoints = (verbose = false) => {
        let points = 0;
        const count = this.getCount();

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
        if (!this.dealer || !this.pone) {
            throw new Error('Null player');
        }
        return `[${this.dealer.getName()} [${this.dealer.getPoints()}|${this.pone.getPoints()}] ${this.pone.getName()}]`;
    };

    private readonly addPoints = (player: PlayerIdentifier, points: number) => {
        if (!this.dealer || !this.pone) {
            throw new Error('Null player');
        }

        (player === PlayerIdentifier.DEALER
            ? this.dealer
            : this.pone
        ).addPoints(points);
        this.log(`The score is now ${this.reportScore()}`);
        this.checkWin();
    };

    private readonly checkWin = () => {
        if (!this.dealer || !this.pone) {
            throw new Error('Null player');
        }

        let winner = null;
        if (this.dealer.getPoints() >= 121) {
            winner = this.dealer;
        } else if (this.pone.getPoints() >= 121) {
            winner = this.pone;
        }

        if (winner) {
            this.log();
            this.log(`${this.dealer.getName()} wins`);
            this.log(`Final score: ${this.reportScore()}`);
            process.exit(0);
        }
    };

    private readonly deal = (
        deck: Deck,
        player1: SocketPlayer,
        player2: SocketPlayer,
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
