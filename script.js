const suits        = ['♥', '♦', '♠', '♣'];
const values       = ['A', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K'];

const balanceHTML  = document.getElementById("playerBalance");

const betInput     = document.getElementById("bet");
const playButton   = document.getElementById("playButton");
const hitButton    = document.getElementById("hitButton");
const standButton  = document.getElementById("standButton");
const doubleButton = document.getElementById("doubleButton");
const splitButton  = document.getElementById("splitButton");

const statusHTML   = document.getElementById("status");
const payHTML      = document.getElementById("pay");

const cardDiv      = document.getElementById("cards");
const dealerHTML   = document.getElementById("dealerCards");
const playerHTML   = document.getElementById("playerCards");

// TODO get from profile
let balance = 10;

let bet = 0;

// global variable to track current player hand to be acted on, de facto game loop control variable
let currentHand = 0;

let standHands = [];

let bustedHands = [];

let endGameHandColors = [];

/**
 * The basic object to facilitate blackjack gameplay.
 */
class Card {
    constructor(value, suit) {
        this.value = value;
        this.suit  = suit;
    }
}

/** 
 * Deck class contains an array of Cards and an index for next to be dealt - top.
 * This Deck class will need to be rewritten for general use.
 * It is a prototype made in particular for testing the class hierarchy,
 * and it lacks constraints.
 */
class Deck {
    constructor(values, suits) {
        this.cards   = new Array();
        this.top     = 0;
        this.topCard = null;
        for (let suit in suits) {
            for (let value in values) {
                this.cards.push(new Card(values[value], suits[suit]));
            }
        }
    }

    /**
     * Shuffle by iterating the array of Cards in reverse, swapping each index
     * with one of random selection. Resets top.
     */
    shuffle() {
        for (let i=this.cards.length-1;i>0;i--) {
            const j = Math.floor(Math.random()*(i+1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
        this.top     = 0;
        this.topCard = this.cards[this.top];

    }

    /**
     * Returns the Card object from the deck indicated by top.
     * Increases top by one.
     */
    dealCard() {
        let outCard = this.topCard;
        this.top++;
        this.topCard = this.cards[this.top];
        return outCard;
    }
}

/**
 * Dealer class contains one array of cards to be played against player hands.
 */
class Dealer {
    constructor() {
        this.hand = new Array();
    }

    /**
     * Push Card object to hand.
     */
    acceptCard(card) {
        this.hand.push(card);
    }

    /**
     * Reinstantiates hand to empty array.
     */
    resetCards() {
        this.hand = new Array();
    }
}

/**
 * Player class contains an array of arrays of cards to be played against dealer hand.
 */
class Player {
    constructor() {
        this.hands = new Array();
    }

    /**
     * Push Card object to hand, indicated by handIndex.
     * Instantiates new hand if none exists.
     */
    acceptCard(card, handIndex) {
        try {
            this.hands[handIndex].push(card);
        } catch(err) {
            this.hands[handIndex] = new Array();
            this.hands[handIndex].push(card);
        }
    }

    /**
     * Reinstantiates hands to empty array.
     */
    resetCards() {
        this.hands = new Array();
    }
}

/**
 * Custom error for sanitizing bet input.
 */
class IllegalBetAmountError extends Error {
    constructor() {
        super("Illegal Bet Amount");
    }
}

/* custom object instantiation */
const deck = new Deck(values, suits);
const dealer = new Dealer();
const player = new Player();

/**
 * To be built for retrieving user profile credit balance.
 */
function updateBalance() {
    balanceHTML.innerHTML = "Balance: "+balance;
}

/**
 * for graphics
 */
function updateStatus(text) {
    if(text=="Playing")
        text += "["+currentHand+"]";
    statusHTML.innerHTML = "---"+text+"---";
}

/**
 * Main function for the game loop.
 */
function start() {
    // LCV
    currentHand = 0;

    standHands = [];
    bustedHands = [];

    deck.shuffle();

    updateStatus("Playing");

    payHTML.innerHTML = "";

    //if a blackjack is dealt
    if(dealStart()) {
        if(calculateHand(dealer.hand)==calculateHand(player.hands[currentHand])) {
            end("Stand");
        } else if (calculateHand(player.hands[currentHand])==21) {
            end("Player BJ");
        } else {
            end("Dealer BJ");
        }
    } else {
        enableControls();
        renderDealerHand(true);
        updateHTML();
    }
}

/**
 * hit
 */
hitButton.addEventListener("click", function() {
    doubleButton.disabled = true;
    splitButton.disabled = true;
    player.acceptCard(deck.dealCard(), currentHand);
    updateHTML();
    if(calculateHand(player.hands[currentHand])>21) {
        end("Busted");
    } else if (calculateHand(player.hands[currentHand])==21) {
        end("Stand");
    }
});

/**
 * stand
 */
standButton.addEventListener("click", function() {
    end("Stand");
});

/**
 * double
 */
doubleButton.addEventListener("click", function() {
    balance -= bet;
    updateBalance();
    player.acceptCard(deck.dealCard(), currentHand);
    updateHTML();
    if(calculateHand(player.hands[currentHand])<=21) {
        end("Doubled");
    } else {
        end("Busted");
    }
});

/**
 * split
 */
splitButton.addEventListener("click", function() {
    balance -= bet;
    updateBalance();
    player.hands.push(new Array(player.hands[currentHand].pop()));
    player.acceptCard(deck.dealCard(), currentHand);
    player.acceptCard(deck.dealCard(), player.hands.length-1);
    splitButton.disabled = (getValue(player.hands[currentHand][0])!=getValue(player.hands[currentHand][1])&&player.hands.length>3);
    updateHTML();
});

/**
 * end
 * the condition parameter is a string to keep track of how the game ended for graphics.
 * this can be changed to the bet payout amount with better user interface graphics.
 */
function end(condition) {

    var winnings = 0;

    switch(condition) {
        case "Dealer BJ":
            // pay nothing
            endGameHandColors[currentHand] = "red";
            break;
        case "Player BJ":
            // pay blackjack three to two rounded up
            endGameHandColors[currentHand] = "green";
            winnings = (bet*2)+(Math.ceil(bet/2));
            break;
        case "Busted":
            // TODO show busted graphic
            bustedHands.push(currentHand);
            break;
        case "Stand":
            standHands.push(currentHand);
            // TODO show stand graphic
            break;
        case "Doubled":
            standHands.push(currentHand);
            standHands.push(currentHand);
            break;
    }

    currentHand++;

    updateHTML();

    // if player has played every hand
    if(currentHand==player.hands.length) {
        disableControls();
        if(standHands.length>0) {
            dealerDraw();
        }
        
        renderDealerHand(false);

        for(hand in standHands) {
            switch(dealerDraw(standHands[hand])) {
                case "Player Win":
                    winnings += (bet*2);
                    endGameHandColors[standHands[hand]] = "green";
                    break;
                case "Push":
                    winnings += bet;
                    endGameHandColors[standHands[hand]] = "purple";
                    break
                case "Dealer Win":
                    endGameHandColors[standHands[hand]] = "red";
                    break;
            }
        }
        for(hand in bustedHands) {
            endGameHandColors[bustedHands[hand]] = "red";
        }
        pay(winnings);
    } else {
        updateHTML();
        enableControls();
        updateStatus("Playing");
    }
}

/**
 * Returns true if a blackjack is dealt.
 * Initial deal two cards to dealer and two cards to player.
 * Resets player and dealer hands.
 */
function dealStart() {
    player.resetCards();
    dealer.resetCards();

    player.acceptCard(deck.dealCard(), 0);
    dealer.acceptCard(deck.dealCard());
    player.acceptCard(deck.dealCard(), 0);
    dealer.acceptCard(deck.dealCard());

    return (calculateHand(dealer.hand)==21||calculateHand(player.hands[0])==21);
}

/**
 * Returns win condition of currentHand against dealer hand.
 * Dealer draws to 17 or greater.
 * Does not yet account for soft hands, dealer should hit on soft 17 in the future.
 * @param playerHand indicates which hand to compare against.
 */
function dealerDraw(playerHand) {
    while(calculateHand(dealer.hand)<17) {
        dealer.acceptCard(deck.dealCard());
    }
    if((calculateHand(dealer.hand)>21)||(calculateHand(dealer.hand)<calculateHand(player.hands[playerHand]))) {
        return "Player Win";
    } else if(calculateHand(dealer.hand)==calculateHand(player.hands[playerHand])) {
        return "Push"
    } else {
        return "Dealer Win"
    }
}

/**
 * Render "graphics"
 */
function updateHTML() {
    playerHTML.innerHTML = "";
    for(hand in player.hands) {
        let temp = document.createElement("div");
        temp.className = "hand";
        temp.id = hand;
        temp.innerHTML = "Player["+hand+"]:"
        for(card in player.hands[hand]) {
            let t = document.createElement("div");
            t.className = "card";
            if(player.hands[hand][card].suit=="♥"||player.hands[hand][card].suit=="♦")
                t.style.color = "red";
            t.innerHTML = toStringCard(player.hands[hand][card]);
            if(temp.id==currentHand) {
                t.style.border = "2px solid blue";
                t.style.borderRadius = "2px";
                t.style.outline = "none";
                t.style.boxShadow = "0 0 10px blue";
            } else if(bustedHands.includes(parseInt(temp.id))) {
                t.style.border = "2px solid red";
                t.style.borderRadius = "2px";
                t.style.outline = "none";
                t.style.boxShadow = "0 0 10px red";
            } else if(standHands.includes(parseInt(temp.id))) {
                t.style.border = "2px solid yellow";
                t.style.borderRadius = "2px";
                t.style.outline = "none";
                t.style.boxShadow = "0 0 10px yellow";
            }
            temp.appendChild(t);
        }

        /* to change outline of html
        if(temp.id==currentHand) {
            temp.style.border = "2px solid blue";
            temp.style.borderRadius = "2px";
            temp.style.outline = "none";
            temp.style.boxShadow = "0 0 10px blue";
        }
        */

        temp.innerHTML += "Total: "+calculateHand(player.hands[hand]);
        playerHTML.appendChild(temp);
    }
}

/**
 * Returns integer value of hand.
 * Computes aces as eleven until hand is busted, then allows aces to be counted as one.
 * This function may need reworked for displaying and calculating soft totals.
 */
function calculateHand(hand) {
    let total = 0;
    let aceCount = 0;

    for(let card in hand) {
        if(hand[card].value==="A")
            aceCount++;
        total += getValue(hand[card]);
    }
    for(let i=0;i<aceCount;i++) {
        if(total>21)
            total-=10;
    }
    return total;
}

/**
 * Returns integer value of Card object.
 * Aces always return 11.
 */
function getValue(card) {
    if(card.value==="J"||card.value==="Q"||card.value==="K")
        return 10;
    else if(card.value==="A")
        return 11;
    else
        return card.value;
}

/**
 * Returns string interpretation of a Card object.
 */
function toStringCard(card) {
    return ""+card.value+card.suit;
}

/**
 * Returns string interpretation of a hand of Cards.
 */
function toStringHand(hand) {
    let t = "";
    for(card in hand) {
        t += toStringCard(hand[card])+", ";
    }
    return t.substring(0,t.length-2);
}

/**
 * space here for a pay command that speaks to user profile.
 */
function pay(amount) {
    balance += amount;
    // TODO add payout attribute to player hands or color (green:win,red:loss,yellow:stand etc)
    payHTML.innerHTML = "---Pay: "+amount+"---";
    updateStatus("Game Over");
    endGameHTML();
    updateBalance();
}

function endGameHTML() {
    playerHTML.innerHTML = "";
    for(hand in player.hands) {
        let temp = document.createElement("div");
        temp.className = "hand";
        temp.id = hand;
        temp.innerHTML = "Player["+hand+"]:"
        for(card in player.hands[hand]) {
            let t = document.createElement("div");
            t.className = "card";
            if(player.hands[hand][card].suit=="♥"||player.hands[hand][card].suit=="♦")
                t.style.color = "red";
            t.innerHTML = toStringCard(player.hands[hand][card]);
            t.style.border = "2px solid "+endGameHandColors[hand];
            t.style.borderRadius = "2px";
            t.style.outline = "none";
            t.style.boxShadow = "0 0 10px "+endGameHandColors[hand];
            temp.appendChild(t);
        }

        /* to change outline of html
        if(temp.id==currentHand) {
            temp.style.border = "2px solid blue";
            temp.style.borderRadius = "2px";
            temp.style.outline = "none";
            temp.style.boxShadow = "0 0 10px blue";
        }
        */

        temp.innerHTML += "Total: "+calculateHand(player.hands[hand]);
        playerHTML.appendChild(temp);
    }
}



// load from user profile
updateBalance();
updateStatus("Ready");

/**
 * Listens for player to intiate game by clicking Play button.
 * Sanitizes bet input.
 * Play Button should be only active button before game loop starts, and disabled during.
 */
playButton.addEventListener("click", function() {
    try {
        confirmBet();
        bet = parseInt(betInput.value);
        balance -= bet;
        updateBalance();
        start();
    } catch(err) {
        alert(err.message);
    }
});

/**
 * Throws a custom IllegalBetAmountError if bet input is below zero, above player balance,
 * or not an integer.
 * This can be changed to a chip system in future iterations.
 */
function confirmBet() {
    if(betInput.value<betInput.getAttribute("min")||betInput.value>balance)
        throw new IllegalBetAmountError();
}

/**
 * Disable all buttons besides play button.
 */
function disableControls() {
    hitButton.disabled = true;
    standButton.disabled = true;
    doubleButton.disabled = true;
    splitButton.disabled = true;
    playButton.disabled = false;
}

/**
 * Set buttons for start of a hand.
 */
function enableControls() {
    playButton.disabled = true;
    hitButton.disabled = false;
    standButton.disabled = false;
    doubleButton.disabled = false;
    splitButton.disabled = (getValue(player.hands[currentHand][0])!=getValue(player.hands[currentHand][1])&&player.hands.length>3);
}

/**
 * @param hidden: boolean value to reveal dealer's hand or only initial card.
 */
function renderDealerHand(hidden) {
    dealerHTML.innerHTML = "Dealer:";
    let total = calculateHand(dealer.hand);
    for(card in dealer.hand) {
        let t = document.createElement("div");
        t.className = "card";
        if(dealer.hand[card].suit=="♥"||dealer.hand[card].suit=="♦")
                t.style.color = "red";
        t.innerHTML = toStringCard(dealer.hand[card]);
        if(hidden&&card>0) {
            t.style.color = "black";
            t.innerHTML = "??";
            total -= getValue(dealer.hand[card]);
        }
        dealerHTML.appendChild(t);
    }
    dealerHTML.innerHTML += "Total: "+total
}