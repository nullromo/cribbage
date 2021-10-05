export const assertUnreachable = (thing: never): never => {
    throw new Error(`Impossible value: ${thing}`);
};

export const randomString = () => {
    return Math.random().toString(36).substring(2, 10);
};
