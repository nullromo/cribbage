"""
Main runner for cribbage.
"""
import sys
from hand import Hand
from cards import Deck#, Card, Suit, random_suit
from player import Player
from util import log

def deal(deck, player1, player2, number):
    """
    Given a deck and 2 players, draws a number of cards from the
    deck and splits them into 2 hands. Then gives the hands to
    the players.
    """
    hand1cards = []
    hand2cards = []
    for _ in range(number):
        hand1cards.append(deck.draw())
        hand2cards.append(deck.draw())
    player1.hand_cards = hand1cards
    player2.hand_cards = hand2cards

def check_win(player1, player2):
    """
    Return the winning player or None if no player has won yet.
    """
    winner = None
    if player1.points >= 121:
        winner = player1
    if player2.points >= 121:
        winner = player2
    if winner:
        print()
        print(player1.name + ' wins')
        sys.exit(0)

def count_peg_points(played_cards, verbose=False):
    """
    Given a stack of played cards, determines how many points
    the player of the latest card pegs for that card.
    """
    points = 0
    count = sum(map(lambda card: card.value, played_cards))

    # count for 15
    if count == 15:
        log(verbose, 'fifteen')
        points += 2

    # count for 31
    if count == 31:
        log(verbose, 'thirty-one')
        points += 1

    # count for pairs
    def addition_factorial(number):
        result = 0
        for i in range(number):
            result += i + 1
        return result

    pairs = 0
    for i in range(len(played_cards) - 2, -1, -1):
        if played_cards[i].rank == played_cards[-1].rank:
            pairs += 1
        else:
            break
    if pairs > 0:
        log(verbose, str(pairs) + (' pair' if pairs == 1 else ' pairs'))
    points += 2 * addition_factorial(pairs)

    # count for runs
    def run_exists(cards):
        cards.sort()
        run = 0
        for i in range(len(cards) - 1):
            if cards[i].rank + 1 != cards[i+1].rank:
                break
            run += 1
        return run == len(cards) - 1

    run_length = 0
    for i in range(1, len(played_cards) + 1):
        last_i_cards = played_cards[-i:]
        if not run_exists(last_i_cards):
            break
        run_length = i

    if run_length >= 3:
        log(verbose, 'run of ' + str(run_length))
        points += run_length

    return points

def main():
    """
    Main.
    """
    print('Welcome to Cribbage.')
    print()
    dealer = Player('Player A')
    pone = Player('Player B')

    print(dealer.name + ' is the dealer.')
    print(pone.name + ' is the pone.')

    def other_player(player):
        if player is dealer:
            return pone
        return dealer

    while True:
        # reset
        crib_cards = []

        # shuffle
        print('Shuffling deck.')
        deck = Deck()
        deck.shuffle()

        # deal
        print('Dealing cards.')
        deal(deck, dealer, pone, 6)

        # throw to crib
        print('Waiting for ' + dealer.name + ' to throw 2 cards to the crib...')
        crib_cards += dealer.throw_to_crib()
        print('Waiting for ' + pone.name + ' to throw 2 cards to the crib...')
        crib_cards += pone.throw_to_crib()

        # cut
        cut_card = deck.draw()
        print('The cut card is ' + str(cut_card) + '.')
        if cut_card.rank == 11:
            print('heels')
            dealer.points += 2
            check_win(dealer, pone)

        # keep track of count points
        dealer_points = Hand(dealer.hand_cards, cut_card).count()
        pone_points = Hand(pone.hand_cards, cut_card).count()
        crib_points = Hand(crib_cards, cut_card, True).count()

        # peg
        played_cards = []
        player_to_play = pone
        passed = None
        while True:
            print('Waiting for ' + player_to_play.name + ' to play a card...')
            played_card = player_to_play.play_card(played_cards)
            if played_card:
                print(player_to_play.name + ' plays ' + str(played_card) + '.')
                played_cards.append(played_card)
                print('Cards in play: ' +
                    str(played_cards) +
                    ' (' +
                    str(sum(map(lambda card: card.value, played_cards))) +
                    ').'
                )
                peg_points = count_peg_points(played_cards)
                if peg_points != 0:
                    print(player_to_play.name + ' pegs ' + str(peg_points) + ' points.')
                    player_to_play.points += peg_points
                    check_win(dealer, pone)
                if len(dealer.hand_cards) == 0 and len(pone.hand_cards) == 0:
                    print(player_to_play.name + ' receives a go.')
                    player_to_play.points += 1
                    check_win(dealer, pone)
                    break
                if not passed:
                    player_to_play = other_player(player_to_play)
            else:
                if not passed:
                    print(player_to_play.name + ' cannot play a card.')
                    passed = player_to_play
                    player_to_play = other_player(player_to_play)
                else:
                    passed = None
                    print(player_to_play.name + ' receives a go.')
                    player_to_play.points += 1
                    check_win(dealer, pone)
                    player_to_play = other_player(player_to_play)
                    played_cards = []
        print()

        # count
        print(pone.name + ' counts ' + str(pone_points) + ' points.')
        pone.points += pone_points
        check_win(dealer, pone)

        print(dealer.name + ' counts ' + str(dealer_points) + ' points.')
        dealer.points += dealer_points
        check_win(dealer, pone)

        print(dealer.name + ' scores ' + str(crib_points) + ' points from the crib.')
        dealer.points += crib_points
        check_win(dealer, pone)

        # new dealer
        dealer, pone = pone, dealer
        print()

if __name__ == '__main__':
    main()
