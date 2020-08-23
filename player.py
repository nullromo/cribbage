"""
Representations for Players
"""
class Player:
    """
    Represents a player in the game.
    """
    def __init__(self, name):
        self.hand_cards = []
        self.points = 0
        self.name = name

    def __str__(self):
        return self.name + ' ' + str(self.hand_cards) + ' (' + str(self.points) + ')'

    def throw_to_crib(self):
        """
        Takes 2 cards out of self.hand_cards and returns them
        as a list.
        """
        print(self.hand_cards)
        input()
        return [self.hand_cards.pop(), self.hand_cards.pop()]

    def play_card(self, played_cards):
        """
        Removes and returns a card from self.hand_cards if there
        is a playable card. Otherwise, returns None (go).
        """
        #TODO: should depend on all information
        print(self.hand_cards)
        input()
        count = sum(map(lambda card: card.value, played_cards))
        for card in self.hand_cards:
            if count + card.value > 31:
                continue
            self.hand_cards.remove(card)
            return card
        return None
