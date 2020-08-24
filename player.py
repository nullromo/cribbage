"""
Representations for Players
"""
class Player:
    """
    Represents a player in the game. The base player just makes
    random decisions for throw_to_crib() and play_card().
    """
    def __init__(self, name):
        self.hand_cards = []
        self.points = 0
        self.name = name

    def __str__(self):
        return self.name + ' ' + str(self.hand_cards) + ' (' + str(self.points) + ')'

    def throw_to_crib(self, dealer):
        """
        Takes 2 cards out of self.hand_cards and returns them
        as a list.
        """
        print(self.hand_cards, dealer)
        return [self.hand_cards.pop(), self.hand_cards.pop()]

    def play_card(self, played_cards):
        """
        Removes and returns a card from self.hand_cards if there
        is a playable card. Otherwise, returns None (go).
        """
        #TODO: should depend on all information
        print(self.hand_cards)
        count = sum(map(lambda card: card.value, played_cards))
        for card in self.hand_cards:
            if count + card.value > 31:
                continue
            self.hand_cards.remove(card)
            return card
        return None

class HumanPlayer(Player):
    """
    Player that takes decisions from stdin.
    """
    def throw_to_crib(self, dealer):
        cards_to_throw = []
        for card_name in ['first', 'second']:
            print()
            print('Throw the ' + card_name + ' card.')
            print('Enter a number to throw the corresponding card.')
            print(self.hand_cards)
            for arrow in [True, False]:
                print(' ', end='')
                for (i, card) in enumerate(self.hand_cards):
                    if card.rank == 10:
                        print(' ', end='')
                    print(('^' if arrow else str(i + 1)) + '   ', end='')
                print()
            index_to_throw = -1
            while index_to_throw < 0:
                try:
                    index_to_throw = int(input())
                    if index_to_throw < 1 or index_to_throw > len(self.hand_cards):
                        index_to_throw = -1
                        raise ValueError()
                except ValueError:
                    print('Please enter a number between 1 and ' + str(len(self.hand_cards)))
            card_to_throw = self.hand_cards[index_to_throw - 1]
            cards_to_throw.append(card_to_throw)
            self.hand_cards.remove(card_to_throw)
        print()
        return cards_to_throw
