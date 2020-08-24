"""
Representations for Players
"""
def check_playable(card, played_cards):
    """
    Given a list of played cards, tells whether the given
    card is playable or not.
    """
    count = sum(map(lambda card: card.value, played_cards))
    if count + card.value > 31:
        return False
    return True

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

    def throw_to_crib(self, _):
        """
        Takes 2 cards out of self.hand_cards and returns them
        as a list.
        """
        return [self.hand_cards.pop(), self.hand_cards.pop()]

    def play_card(self, played_cards):
        """
        Removes and returns a card from self.hand_cards if there
        is a playable card. Otherwise, returns None (go).
        """
        for card in self.hand_cards:
            if not check_playable(card, played_cards):
                continue
            self.hand_cards.remove(card)
            return card
        return None

class HumanPlayer(Player):
    """
    Player that takes decisions from stdin.
    """
    def select_card(self):
        """
        Allows a card to be selected from the player's hand.
        """
        print('Enter a number to select the corresponding card.')
        print(self.hand_cards)
        for arrow in [True, False]:
            print(' ', end='')
            for (i, card) in enumerate(self.hand_cards):
                if card.rank == 10:
                    print(' ', end='')
                print(('^' if arrow else str(i + 1)) + '   ', end='')
            print()
        index = -1
        while index < 0:
            try:
                index = int(input())
                if index < 1 or index > len(self.hand_cards):
                    index = -1
                    raise ValueError()
            except ValueError:
                print('Please enter a number between 1 and ' + str(len(self.hand_cards)))
        selected_card = self.hand_cards[index - 1]
        self.hand_cards.remove(selected_card)
        return selected_card

    def throw_to_crib(self, dealer):
        cards_to_throw = []
        print('Throw 2 cards into your' + (' ' if dealer else " opponent's ") + 'crib.')
        for card_name in ['first', 'second']:
            print()
            print('Throw the ' + card_name + ' card.')
            card_to_throw = self.select_card()
            cards_to_throw.append(card_to_throw)
        print()
        return cards_to_throw

    def play_card(self, played_cards):
        for card in self.hand_cards:
            if check_playable(card, played_cards):
                print()
                print('Play a card.')
                selected_card = self.select_card()
                if check_playable(selected_card, played_cards):
                    return selected_card
                print(str(selected_card) + ' is not playable. Select a different card.')
                self.hand_cards.append(selected_card)
                return self.play_card(played_cards)
        print('No playable cards left.')
        return None
