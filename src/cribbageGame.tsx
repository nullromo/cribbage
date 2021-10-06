import { clientEventNames, serverEventNames } from 'common/events';
import { GameState } from 'common/gameState';
import React from 'react';
import { Card } from 'server/game/cards';
import { Socket } from 'socket.io-client';

interface CardSelectorProps {
    numberOfCards: number;
    submit: (data: { thrownCardNumbers: number[] }) => void;
    //TODO: add state for selected cards
}

class CardSelector extends React.Component<CardSelectorProps> {
    public readonly render = () => {
        return (
            <tr>
                {[...Array(this.props.numberOfCards).keys()].map((i) => {
                    return (
                        <td key={i}>
                            <input
                                type='checkbox'
                                onChange={(event) => {
                                    console.log(
                                        'change',
                                        i,
                                        event.target.checked,
                                    );
                                }}
                            />
                        </td>
                    );
                })}
                <td>
                    <button
                        type='button'
                        onClick={() => {
                            this.props.submit({ thrownCardNumbers: [0, 1] });
                        }}
                    >
                        Throw
                    </button>
                </td>
            </tr>
        );
    };
}

interface CribbageGameProps {
    gameCode: string;
    socket: Socket;
    username: string;
}

interface CribbageGameState {
    gameLog: string[];
    hand: Card[];
    playedCards: Card[];
    score: {
        opponent: number;
        you: number;
    };
    turn: {
        state: GameState;
        you: boolean;
    };
}

export class CribbageGame extends React.Component<
    CribbageGameProps,
    CribbageGameState
> {
    public constructor(props: CribbageGameProps) {
        super(props);
        this.state = {
            gameLog: [],
            hand: [],
            playedCards: [],
            score: {
                opponent: 0,
                you: 0,
            },
            turn: {
                state: GameState.SETUP,
                you: false,
            },
        };
    }

    public readonly componentDidMount = () => {
        this.props.socket.on(
            clientEventNames.GAME_STATE_UPDATE,
            ({ hand, log, playedCards, score, turn }) => {
                this.setState({
                    gameLog: log,
                    hand: hand.map((card: Card) => {
                        return Card.copy(card);
                    }),
                    playedCards: playedCards.map((card: Card) => {
                        return Card.copy(card);
                    }),
                    score: { ...score },
                    turn: { ...turn },
                });
            },
        );
    };

    public readonly componentDidUpdate = () => {
        this.messageBox?.scrollTo({ top: this.messageBox.clientHeight });
    };

    private messageBox: HTMLDivElement | null = null;

    public readonly render = () => {
        return (
            <>
                {`In game: ${this.props.gameCode}`}
                <br />
                {`Your name: ${this.props.username}`}
                <br />
                {`Your score: ${this.state.score.you}`}
                <br />
                {`Opponent's score: ${this.state.score.opponent}`}
                <br />
                {`Cards in play: ${
                    this.state.playedCards
                } (count = ${this.state.playedCards.reduce((total, next) => {
                    return total + next.value;
                }, 0)})`}
                <br />
                {`Your hand: ${this.state.hand}`}
                <br />
                {this.state.turn.you ? 'Your turn' : "Opponent's turn"}
                <br />
                <table>
                    <tbody>
                        <tr>
                            {this.state.hand.map((card, i) => {
                                return <td key={i}>{card.toString()}</td>;
                            })}
                        </tr>
                        {(() => {
                            if (!this.state.turn.you) {
                                return null;
                            }

                            switch (this.state.turn.state) {
                                case GameState.AWAIT_PLAY:
                                    return (
                                        <tr>
                                            {this.state.hand.map((_, i) => {
                                                return (
                                                    <td key={i}>
                                                        <button
                                                            type='button'
                                                            onClick={() => {
                                                                this.props.socket.emit(
                                                                    serverEventNames.PLAY,
                                                                    {
                                                                        playedCardNumber:
                                                                            i,
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            play
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                case GameState.AWAIT_THROW_TO_CRIB:
                                    return (
                                        <CardSelector
                                            numberOfCards={
                                                this.state.hand.length
                                            }
                                            submit={({ thrownCardNumbers }) => {
                                                this.props.socket.emit(
                                                    serverEventNames.THROW_TO_CRIB,
                                                    { thrownCardNumbers },
                                                );
                                            }}
                                        />
                                    );

                                default:
                                    return null;
                            }
                        })()}
                    </tbody>
                </table>
                <br />
                <div
                    ref={(element) => {
                        this.messageBox = element;
                    }}
                    className='message-box'
                >
                    {this.state.gameLog.map((message, i) => {
                        return (
                            <div key={i}>
                                {message === '' ? '\u00A0' : message}
                            </div>
                        );
                    })}
                </div>
            </>
        );
    };
}
