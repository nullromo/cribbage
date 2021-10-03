import { clientEventNames, serverEventNames } from 'common/events';
import React from 'react';
import { io, Socket } from 'socket.io-client';

type EmptyProps = Record<never, never>;

interface CribbageLobbyProps {
    gameJoined: (gameCode: string) => void;
}

interface CribbageLobbyState {
    gameCode: string;
    gameCodeToJoin: string;
    requestPending: boolean;
}

class CribbageLobby extends React.Component<
    CribbageLobbyProps,
    CribbageLobbyState
> {
    public constructor(props: CribbageLobbyProps) {
        super(props);
        console.log('hello');
        this.socket = io('http://localhost:3001');
        this.state = {
            gameCode: '',
            gameCodeToJoin: '',
            requestPending: false,
        };
    }

    private readonly socket: Socket;

    public readonly render = () => {
        return (
            <div>
                <button
                    disabled={this.state.requestPending}
                    type='button'
                    onClick={() => {
                        this.setState({ requestPending: true }, () => {
                            this.socket.emit(serverEventNames.CREATE_GAME);
                            this.socket.once(
                                clientEventNames.GAME_CREATED,
                                ({ gameCode }) => {
                                    this.setState({
                                        gameCode,
                                        requestPending: false,
                                    });
                                    this.props.gameJoined(gameCode);
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
                            this.socket.emit(serverEventNames.JOIN_GAME, {
                                gameCode: this.state.gameCodeToJoin,
                            });
                            this.socket.once(
                                clientEventNames.GAME_JOIN_RESPONSE,
                                ({ message, success }) => {
                                    if (message) {
                                        console.log(message);
                                    }
                                    this.setState({ requestPending: false });
                                    if (success) {
                                        this.props.gameJoined(
                                            this.state.gameCodeToJoin,
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
}

class CribbageGame extends React.Component<CribbageGameProps> {
    public readonly render = () => {
        return <div>{this.props.gameCode}</div>;
    };
}

interface CribbageMainState {
    gameCode: string | null;
}

export class CribbageMain extends React.Component<
    EmptyProps,
    CribbageMainState
> {
    public constructor(props: EmptyProps) {
        super(props);
        this.state = {
            gameCode: null,
        };
    }

    public readonly render = () => {
        if (this.state.gameCode) {
            return <CribbageGame gameCode={this.state.gameCode} />;
        }
        return (
            <CribbageLobby
                gameJoined={(gameCode) => {
                    this.setState({ gameCode });
                }}
            />
        );
    };
}
