import { clientEventNames, serverEventNames } from 'common/events';
import { randomString } from 'common/util';
import React from 'react';
import { Socket } from 'socket.io-client';

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

export class CribbageLobby extends React.Component<
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
