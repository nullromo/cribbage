import { randomString } from '../common/util';
import cors from 'cors';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { clientEventNames, serverEventNames } from '../common/events';
import { NetworkCribbageGame } from './game/networkGame';
import { SocketPlayer } from './game/player';
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        methods: ['GET', 'POST'],
        origin: (origin, callback) => {
            if (
                ['http://localhost:3000', 'http://157.131.141.217:3000'].some(
                    (address) => {
                        return origin === address;
                    },
                )
            ) {
                callback(null, true);
            } else {
                const message = `Address "${origin}" blocked by cors.`;
                console.error(message);
                callback(new Error(message));
            }
        },
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

    socket.on(serverEventNames.CREATE_GAME, ({ username }) => {
        const gameCode = randomString();
        const game = new NetworkCribbageGame();
        game.addPlayer(new SocketPlayer(username, socket));
        games[gameCode] = {
            game,
            socketIDs: [socket.id],
        };
        socket.emit(clientEventNames.GAME_CREATED, { gameCode });
    });

    socket.on(serverEventNames.JOIN_GAME, ({ gameCode, username }) => {
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
                    game.game.addPlayer(new SocketPlayer(username, socket));
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
