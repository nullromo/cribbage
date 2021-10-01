class Utility {
    public arrayShuffle = <T>(array: T[]) => {
        let currentIndex = array.length;
        let temporaryValue;
        let randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    };

    public arraySample = <T>(array: Readonly<T[]>) => {
        if (array.length === 0) {
            throw new Error('Tried to sample empty array');
        }
        return array[Math.floor(Math.random() * array.length)];
    };

    public readonly log = (verbose: boolean, ...messages: string[]) => {
        if (verbose) {
            console.log(...messages);
        }
    };
}

export const Util = new Utility();
