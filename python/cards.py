"""
Representations for cards and decks.
"""
from enum import Enum
import itertools
import random

SUITS = {
    1: ['♠', 'SPADES'],
    2: ['♥', 'HEARTS'],
    3: ['♦', 'DIAMONDS'],
    4: ['♣', 'CLUBS'],
}

Suit = Enum(
    value='Suit',
    names=itertools.chain.from_iterable(
        itertools.product(v, [k]) for k, v in SUITS.items()
    )
)

def random_suit():
    """
    Returns a random suit.
    """
    return random.choice(list(Suit))

class Card:
    """
    Represents a card. Requires a suit and a rank.
    """
    def __init__(self, suit, rank):
        if not suit in set(x for x in Suit):
            raise RuntimeError('Illegal suit ("' + str(suit) + '")')
        if rank not in range(1, 14):
            raise RuntimeError('Illegal rank ("' + str(rank) + '")')
        self.suit = suit
        self.rank = rank
        self.value = min(rank, 10)

    def __str__(self):
        if self.rank == 1:
            name = 'A'
        elif self.rank == 11:
            name = 'J'
        elif self.rank == 12:
            name = 'Q'
        elif self.rank == 13:
            name = 'K'
        else:
            name = str(self.rank)
        return name + self.suit.name

    def __repr__(self):
        return str(self)

    def __lt__(self, other):
        return self.rank < other.rank

class Deck:
    """
    Represents a deck of cards.
    """
    def __init__(self):
        self.cards = [Card(suit, rank) for rank in range(1, 14) for suit in Suit]

    def __str__(self):
        return 'Deck: ' + str(self.cards)

    def __len__(self):
        return len(self.cards)

    def shuffle(self):
        """
        Randomizes the order of the deck.
        """
        random.shuffle(self.cards)

    def draw(self):
        """
        Removes and returns the top card of the deck.
        """
        return self.cards.pop()
