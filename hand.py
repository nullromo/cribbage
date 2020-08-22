"""

"""
import itertools
import functools
from cards import Deck, Card, Suit, random_suit

class Hand:
    """
    Represents a hand of cards.
    """
    def __init__(self, hand_cards, cut_card=None, crib=False):
        if cut_card:
            self.cards = hand_cards + [cut_card]
        else:
            self.cards = hand_cards
        for card in self.cards:
            if not isinstance(card, Card):
                raise RuntimeError('Illegal value ("' + str(card) + '")')
        self.hand_cards = hand_cards
        self.cut_card = cut_card
        self.crib = crib

    def __str__(self):
        string = 'Hand: [' + str(self.hand_cards[0])
        for card in self.hand_cards[1:]:
            string += ', ' + str(card)
        if self.cut_card:
            string += ' | ' + str(self.cut_card)
        if self.crib:
            string += ' | crib'
        string += ']'
        return string

    def count(self):
        """
        Returns the point count for the hand.
        """
        points = 0

        # all possible subsets of cards within the hand
        subsets = functools.reduce(lambda x, y: list(x) + list(y), [itertools.combinations(self.cards, x + 1) for x in range(len(self.cards))])

        for subset in subsets:
            subset_ranks = list(map(lambda card: card.rank, list(subset)))

            # count fifteens
            if sum(list(map(lambda card: card.value, list(subset)))) == 15:
                print('  fifteen')
                points += 2

            # count pairs
            if len(subset) == 2 and subset_ranks[0] == subset_ranks[1]:
                print('  pair')
                points += 2

            # count runs
            smallest_rank = min(subset_ranks)
            run_length = 1
            while smallest_rank + run_length in subset_ranks:
                run_length += 1
            card_ranks = list(map(lambda x: x.rank, self.cards))
            if run_length >= 3 and run_length == len(subset) and smallest_rank + run_length not in card_ranks and smallest_rank - 1 not in card_ranks:
                print('  run of ' + str(run_length))
                points += run_length

        # count flushes
        flush_suit = functools.reduce(lambda x, y: x if x == y else False, map(lambda x: x.suit, self.hand_cards))
        cut_matches = self.cut_card.suit == flush_suit
        flush_points = 0
        if cut_matches:
            flush_points = len(self.cards)
        elif not self.crib and flush_suit:
            flush_points = len(self.cards) - 1
        if flush_points > 0:
            print('  ' + str(flush_points) + '-card flush')
            points += flush_points

        # count knob
        if len([card for card in self.hand_cards if card.rank == 11 and card.suit == self.cut_card.suit]) > 0:
            print('  knob')
            points += 1

        return points

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
