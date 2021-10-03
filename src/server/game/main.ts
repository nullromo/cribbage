/**
 * @brief Main runner for cribbage.
 */
import { Card, Deck } from './cards';
import { Hand } from './hand';
import { HumanPlayer, Player } from './player';
import { Util } from './util';

class CribbageGame {
    /**
     * Given a deck and 2 players, draws a number of cards from the deck and splits
     * them into 2 hands. Then gives the hands to the players.
     */
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

    /**
     * @brief Returns the score formatted nicely.
     */
    private readonly reportScore = (player1: Player, player2: Player) => {
        return `[${player1.getName()} [${player1.getPoints()}|${player2.getPoints()}] ${player2.getName()}]`;
    };

    /**
     * @brief Return the winning player or None if no player has won yet.
     */
    private readonly checkWin = (player1: Player, player2: Player) => {
        let winner = null;
        if (player1.getPoints() >= 121) {
            winner = player1;
        } else if (player2.getPoints() >= 121) {
            winner = player2;
        }

        if (winner) {
            console.log();
            console.log(`${player1.getName()} wins`);
            console.log(`Final score: ${this.reportScore(player1, player2)}`);
            process.exit(0);
        }
    };

    /**
     * @brief Given a stack of played cards, determines how many points the player
     * of the latest card pegs for that card.
     */
    private readonly countPegPoints = (
        playedCards: Card[],
        verbose = false,
    ) => {
        let points = 0;
        const count = playedCards
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
            ...Array(Math.max(playedCards.length - 1, 0)).keys(),
        ].reverse()) {
            if (
                playedCards[i].rank === playedCards[playedCards.length - 1].rank
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
        [...Array(playedCards.length + 1).keys()].slice(1).forEach((i) => {
            const lastICards = playedCards.slice(playedCards.length - i);
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

    /**
     * @brief Adds an amount of points to a player's score and reports the scores
     * if desired.
     */
    private readonly addPoints = (
        player: Player,
        points: number,
        otherPlayer: Player,
        report = true,
    ) => {
        player.addPoints(points);
        if (report) {
            console.log(
                `The score is now ${this.reportScore(player, otherPlayer)}`,
            );
        }
    };

    public readonly run = async () => {
        console.log('Welcome to Cribbage.');
        console.log();
        let dealer: Player = new Player('Player A');
        let pone: Player = new HumanPlayer('Player B');

        console.log(`${dealer.getName()} is the dealer.`);
        console.log(`${pone.getName()} is the pone.`);

        const otherPlayer = (player: Player) => {
            if (player === dealer) {
                return pone;
            }
            return dealer;
        };

        /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
        while (true) {
            // reset
            let cribCards: Card[] = [];

            // shuffle
            console.log('Shuffling deck.');
            const deck = new Deck();
            deck.shuffle();

            // deal
            console.log('Dealing cards.');
            this.deal(deck, dealer, pone, 6);

            // throw to crib
            console.log(
                `Waiting for ${dealer.getName()} to throw 2 cards to the crib...`,
            );
            /* eslint-disable-next-line no-await-in-loop */
            const dealerThrew = await dealer.throwToCrib(true);
            console.log(
                `${dealer.getName()} threw ${dealerThrew} into the crib.`,
            );
            cribCards = [...cribCards, ...dealerThrew];

            console.log(
                `Waiting for ${pone.getName()} to throw 2 cards to the crib...`,
            );
            /* eslint-disable-next-line no-await-in-loop */
            const poneThrew = await pone.throwToCrib(false);
            console.log(`${pone.getName()} threw ${poneThrew} into the crib.`);
            cribCards = [...cribCards, ...poneThrew];

            // cut
            const cutCard = deck.draw();
            console.log(`The cut card is ${cutCard}.`);
            if (cutCard.rank == 11) {
                console.log(
                    `${dealer.getName()} receives 2 points for the Jack's heels.`,
                );
                this.addPoints(dealer, 2, pone);
                this.checkWin(dealer, pone);
            }

            // keep track of count points
            const dealerPoints = new Hand(
                dealer.getHandCards(),
                cutCard,
            ).count();
            const ponePoints = new Hand(pone.getHandCards(), cutCard).count();
            const cribPoints = new Hand(cribCards, cutCard, true).count();

            // peg
            let playedCards: Card[] = [];
            let playerToPlay: Player = pone;
            let passed = null;
            /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
            while (true) {
                console.log(
                    `Waiting for ${playerToPlay.getName()} to play a card...`,
                );
                /* eslint-disable-next-line no-await-in-loop */
                const playedCard = await playerToPlay.playCard(playedCards);
                if (playedCard) {
                    console.log(
                        `${playerToPlay.getName()} plays ${playedCard}.`,
                    );
                    playedCards.push(playedCard);
                    console.log(
                        `Cards in play: ${playedCards} (${playedCards
                            .map((card) => {
                                return card.value;
                            })
                            .reduce((total, next) => {
                                return total + next;
                            }, 0)}).`,
                    );
                    const pegPoints = this.countPegPoints(playedCards);
                    if (pegPoints != 0) {
                        console.log(
                            `${playerToPlay.getName()} pegs ${pegPoints} points.`,
                        );
                        this.addPoints(
                            playerToPlay,
                            pegPoints,
                            otherPlayer(playerToPlay),
                        );
                        this.checkWin(dealer, pone);
                    }
                    if (
                        dealer.getHandCards().length === 0 &&
                        pone.getHandCards().length === 0
                    ) {
                        console.log(`${playerToPlay.getName()} receives a go.`);
                        this.addPoints(
                            playerToPlay,
                            1,
                            otherPlayer(playerToPlay),
                        );
                        this.checkWin(dealer, pone);
                        break;
                    }
                    if (!passed) {
                        playerToPlay = otherPlayer(playerToPlay);
                    }
                } else if (!passed) {
                    console.log(
                        `${playerToPlay.getName()} cannot play a card.`,
                    );
                    passed = playerToPlay;
                    playerToPlay = otherPlayer(playerToPlay);
                } else {
                    passed = null;
                    console.log(`${playerToPlay.getName()} receives a go.`);
                    this.addPoints(playerToPlay, 1, otherPlayer(playerToPlay));
                    this.checkWin(dealer, pone);
                    playerToPlay = otherPlayer(playerToPlay);
                    playedCards = [];
                }
            }
            console.log();

            // count
            console.log(`${pone.getName()} counts ${ponePoints} points.`);
            this.addPoints(pone, ponePoints, dealer, false);
            this.checkWin(dealer, pone);

            console.log(`${dealer.getName()} counts ${dealerPoints} points.`);
            this.addPoints(dealer, dealerPoints, pone, false);
            this.checkWin(dealer, pone);

            console.log(
                `${dealer.getName()} scores ${cribPoints} points from the crib.`,
            );
            this.addPoints(dealer, cribPoints, pone);
            this.checkWin(dealer, pone);

            // new dealer
            [dealer, pone] = [pone, dealer];
            console.log();
        }
    };
}

export class NetworkCribbageGame {}
