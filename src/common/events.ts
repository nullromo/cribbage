export enum serverEventNames {
    CREATE_GAME = 'CREATE_GAME',
    JOIN_GAME = 'JOIN_GAME',
    THROW_TO_CRIB = 'THROW_TO_CRIB',
    PLAY = 'PLAY',
    PASS = 'PASS',
}

export enum clientEventNames {
    GAME_CREATED = 'GAME_CREATED',
    GAME_JOIN_RESPONSE = 'GAME_JOIN_RESPONSE',
    GAME_STATE_UPDATE = 'GAME_STATE_UPDATE',
}
