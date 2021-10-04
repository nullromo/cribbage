import cors from 'cors';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { clientEventNames, serverEventNames } from '../common/events';
import { NetworkCribbageGame } from './game/main';
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        methods: ['GET', 'POST'],
        origin: 'http://localhost:3000',
    },
});

app.use(cors({ credentials: true }));

type GameMapEntry = {
    game: NetworkCribbageGame;
    socketIDs: string[];
};

let games: Partial<Record<string, GameMapEntry>> = {};

server.listen(3001, () => {
    console.log('Express server is running');
});

io.on('connection', (socket) => {
    console.log(
        `Client ${socket.id} connected from ${socket.handshake.address}`,
    );

    socket.on('disconnect', () => {
        console.log(`Client ${socket.id} disconnected.`);
        games = Object.fromEntries(
            Object.entries(games)
                .map(([gameCode, game]) => {
                    if (!game) {
                        return [gameCode, undefined];
                    }
                    return [
                        gameCode,
                        {
                            game: game.game,
                            socketIDs: game.socketIDs.filter((id) => {
                                return id !== socket.id;
                            }),
                        },
                    ];
                })
                .filter(([_, game]) => {
                    if (typeof game === 'string') {
                        return false;
                    }
                    return game && game.socketIDs.length > 0;
                }),
        );
        console.log(games);
    });

    socket.on(serverEventNames.CREATE_GAME, () => {
        const gameCode = Math.random().toString(36).substring(2, 10);
        games[gameCode] = {
            game: new NetworkCribbageGame(),
            socketIDs: [socket.id],
        };
        socket.emit(clientEventNames.GAME_CREATED, { gameCode });
    });

    socket.on(serverEventNames.JOIN_GAME, ({ gameCode }) => {
        const game = games[gameCode];
        if (game) {
            if (game.socketIDs.length < 2) {
                if (
                    game.socketIDs.some((id) => {
                        return id === socket.id;
                    })
                ) {
                    socket.emit(clientEventNames.GAME_JOIN_RESPONSE, {
                        message: `You are already in game ${gameCode}.`,
                        success: false,
                    });
                } else {
                    game.socketIDs.push(socket.id);
                    socket.emit(clientEventNames.GAME_JOIN_RESPONSE, {
                        message: `Joined game ${gameCode}`,
                        success: true,
                    });
                }
            } else {
                socket.emit(clientEventNames.GAME_JOIN_RESPONSE, {
                    message: `Game ${gameCode} is full.`,
                    success: false,
                });
            }
        } else {
            socket.emit(clientEventNames.GAME_JOIN_RESPONSE, {
                message: `No game with code ${gameCode} exists.`,
                success: false,
            });
        }
    });
});