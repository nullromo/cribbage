import { CribbageGame } from 'cribbageGame';
import { CribbageLobby } from 'cribbageLobby';
import React from 'react';
import { io, Socket } from 'socket.io-client';

type EmptyProps = Record<never, never>;

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
