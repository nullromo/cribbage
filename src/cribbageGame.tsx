import { clientEventNames, serverEventNames } from 'common/events';
import React from 'react';
import { Card } from 'server/game/cards';
import { Socket } from 'socket.io-client';

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
        };
    }

    public readonly componentDidMount = () => {
        this.props.socket.on(
            clientEventNames.GAME_STATE_UPDATE,
            ({ hand, log, playedCards, score }) => {
                this.setState({
                    gameLog: log,
                    hand: hand.map((card: Card) => {
                        return Card.copy(card);
                    }),
                    playedCards: playedCards.map((card: Card) => {
                        return Card.copy(card);
                    }),
                    score: { ...score },
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
                <br />
                <button
                    type='button'
                    onClick={() => {
                        this.props.socket.emit(serverEventNames.THROW_TO_CRIB, {
                            thrownCardNumbers: [0, 1],
                        });
                    }}
                >
                    test throw
                </button>
                <button
                    type='button'
                    onClick={() => {
                        this.props.socket.emit(serverEventNames.PLAY, {
                            playedCardNumber: 0,
                        });
                    }}
                >
                    test play
                </button>
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
