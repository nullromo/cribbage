import { clientEventNames, serverEventNames } from 'common/events';
import { randomString } from 'common/util';
import React from 'react';
import { io, Socket } from 'socket.io-client';

type EmptyProps = Record<never, never>;

interface CribbageLobbyProps {
    gameJoined: (gameCode: string, username: string) => void;
    socket: Socket;
}

interface CribbageLobbyState {
    gameCode: string;
    gameCodeToJoin: string;
    requestPending: boolean;
    username: string;
}

class CribbageLobby extends React.Component<
    CribbageLobbyProps,
    CribbageLobbyState
> {
    public constructor(props: CribbageLobbyProps) {
        super(props);
        this.state = {
            gameCode: '',
            gameCodeToJoin: '',
            requestPending: false,
            username: `Player-${randomString()}`,
        };
    }

    public readonly render = () => {
        return (
            <div>
                <input
                    type='text'
                    value={this.state.username}
                    onChange={(event) => {
                        this.setState({ username: event.target.value });
                    }}
                />
                <br />
                <button
                    disabled={this.state.requestPending}
                    type='button'
                    onClick={() => {
                        this.setState({ requestPending: true }, () => {
                            this.props.socket.emit(
                                serverEventNames.CREATE_GAME,
                                { username: this.state.username },
                            );
                            this.props.socket.once(
                                clientEventNames.GAME_CREATED,
                                ({ gameCode }) => {
                                    this.setState({
                                        gameCode,
                                        requestPending: false,
                                    });
                                    this.props.gameJoined(
                                        gameCode,
                                        this.state.username,
                                    );
                                },
                            );
                        });
                    }}
                >
                    Create Game
                </button>
                <br />
                <input
                    type='text'
                    value={this.state.gameCodeToJoin}
                    onChange={(event) => {
                        this.setState({ gameCodeToJoin: event.target.value });
                    }}
                />
                <button
                    disabled={this.state.requestPending}
                    type='button'
                    onClick={() => {
                        this.setState({ requestPending: true }, () => {
                            this.props.socket.emit(serverEventNames.JOIN_GAME, {
                                gameCode: this.state.gameCodeToJoin,
                                username: this.state.username,
                            });
                            this.props.socket.once(
                                clientEventNames.GAME_JOIN_RESPONSE,
                                ({ message, success }) => {
                                    if (message) {
                                        console.log(message);
                                    }
                                    this.setState({ requestPending: false });
                                    if (success) {
                                        this.props.gameJoined(
                                            this.state.gameCodeToJoin,
                                            this.state.username,
                                        );
                                    }
                                },
                            );
                        });
                    }}
                >
                    Join Game{' '}
                </button>

                <div>{this.state.gameCode}</div>
            </div>
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
}

class CribbageGame extends React.Component<
    CribbageGameProps,
    CribbageGameState
> {
    public constructor(props: CribbageGameProps) {
        super(props);
        this.state = {
            gameLog: [],
        };
    }

    public readonly componentDidMount = () => {
        this.props.socket.on(clientEventNames.GAME_STATE_UPDATE, ({ log }) => {
            this.setState({
                gameLog: log,
            });
        });
    };

    public readonly render = () => {
        return (
            <>
                {`In game: ${this.props.gameCode}`}
                <br />
                {`Your name: ${this.props.username}`}
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
                <div>
                    {this.state.gameLog.map((message, i) => {
                        return <div key={i}>{message}</div>;
                    })}
                </div>
            </>
        );
    };
}

interface CribbageMainState {
    gameCode: string | null;
    username: string;
}

export class CribbageMain extends React.Component<
    EmptyProps,
    CribbageMainState
> {
    public constructor(props: EmptyProps) {
        super(props);
        this.socket = io('http://localhost:3001');
        this.state = {
            gameCode: null,
            username: '',
        };
    }

    private readonly socket: Socket;

    public readonly render = () => {
        if (this.state.gameCode) {
            return (
                <CribbageGame
                    gameCode={this.state.gameCode}
                    socket={this.socket}
                    username={this.state.username}
                />
            );
        }
        return (
            <CribbageLobby
                gameJoined={(gameCode, username) => {
                    this.setState({ gameCode, username });
                }}
                socket={this.socket}
            />
        );
    };
}
