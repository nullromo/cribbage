"""
Main runner for cribbage.
"""
from hand import Hand
from cards import Deck, Card, Suit, random_suit

def main():
    """
    main.
    """
    def random_suit_hand(ranks):
        return Hand([Card(random_suit(), rank) for rank in ranks[:-1]], Card(random_suit(), ranks[-1]))

    hands = [
        random_suit_hand([1, 2, 3, 4, 5]),
        random_suit_hand([7, 8, 7, 4, 11]),
        random_suit_hand([1, 2, 3, 4, 5]),
        Hand([Card(Suit.SPADES, 2), Card(Suit.SPADES, 12), Card(Suit.SPADES, 3), Card(Suit.SPADES, 5)], Card(Suit.SPADES, 9)),
        Hand([Card(Suit.SPADES, 11), Card(Suit.SPADES, 12), Card(Suit.SPADES, 3), Card(Suit.SPADES, 5)], Card(Suit.HEARTS, 9)),
        Hand([Card(Suit.SPADES, 11), Card(Suit.SPADES, 12), Card(Suit.SPADES, 3), Card(Suit.SPADES, 5)], Card(Suit.HEARTS, 9), crib=True),
        Hand([Card(Suit.DIAMONDS, 5), Card(Suit.HEARTS, 5), Card(Suit.CLUBS, 11), Card(Suit.SPADES, 5)], Card(Suit.CLUBS, 5)),
        Hand([Card(Suit.DIAMONDS, 2), Card(Suit.HEARTS, 4), Card(Suit.CLUBS, 6), Card(Suit.SPADES, 8)], Card(Suit.CLUBS, 13)),
    ]

    # for hand in hands:
    #     print(hand)
    #     print('Total: ' + str(hand.count()))
    #     print()

    for _ in range(10):
        deck = Deck()
        deck.shuffle()
        hand = Hand([deck.draw() for _ in range(4)], deck.draw())
        print(hand)
        print('Total: ' + str(hand.count()))
        print()

if __name__ == '__main__':
    main()
