export const assertUnreachable = (thing: never): never => {
    throw new Error(`Impossible value: ${thing}`);
};
