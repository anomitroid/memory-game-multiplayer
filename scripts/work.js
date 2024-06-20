const socket = io();
const grid = document.getElementById('grid');
let level = 1;
let gridSize = 4;
const levelContainer = document.getElementById('level');

levelContainer.innerText += ` ${level.toString()}`;

let currentArray = {};
let currentCards = [];
let randomArray = [];

let selections = 2;

const winBox = document.querySelector('.win-loss');
let movesAllowed = 15;
const updateMoves = (movesAllowed) => winBox.innerHTML = `Moves Left: ${movesAllowed}`;
const progressMade = document.querySelector('.progress');
let progress = 0;
const updateProgress = (progress) => progressMade.innerHTML = `Pairs Found: ${progress}`;

// Receive the currentArray from the server
socket.on('currentArray', ({ currentArray: serverCurrentArray, randomArray: serverRandomArray }) => {
    currentArray = serverCurrentArray;
    randomArray = serverRandomArray;
    currentCards = [];
    console.log('Received currentArray from server:', currentArray);
    console.log('Received randomArray from server:', randomArray);
    grid.innerHTML = '';
    // Proceed with creating the grid using the received currentArray
    createGrid(gridSize);
});

function createCard(randomArray, arrayIndex) {
    const card = document.createElement('div');
    card.classList.add('flip-card');
    card.style.flex = '0 0 calc(100% / ' + gridSize + ')';
    const innerCard = document.createElement('div');
    innerCard.classList.add('flip-card-inner');
    const frontCard = document.createElement('div');
    frontCard.classList.add('flip-card-front');
    const backCard = document.createElement('div');
    backCard.classList.add('flip-card-back');
    const img = document.createElement('img');
    img.src = currentArray[randomArray[arrayIndex]];
    backCard.appendChild(img);
    card.dataset.num = randomArray[arrayIndex++];
    card.appendChild(innerCard);
    innerCard.appendChild(backCard);
    innerCard.appendChild(frontCard);
    return [card, arrayIndex];
}

function createGrid(gridSize) {
    const gridSqNumber = gridSize * gridSize;
    let arrayIndex = 0;
    for (let i = 0; i < gridSqNumber; i++) {
        let card;
        [card, arrayIndex] = createCard(randomArray, arrayIndex);
        currentCards.push(card);
        grid.appendChild(card);

        // Add click event listener to flip the card
        card.addEventListener('click', () => {
            handleCardClick(card);
        });
    }
}

(function () {
    updateMoves(movesAllowed);
    updateProgress(progress);
})();

let lastClickTime = 0;
const clickDelay = 500;
let chosenCards = new Set();

// Listen for the 'flipCard' event from the server and update the card state
socket.on('flipCard', (cardData) => {
    const card = currentCards[cardData.index]; // Find the card using the index
    if (card) {
        if (cardData.isFlipped) {
            card.classList.add('flip-card-clicked');
        } else {
            card.classList.remove('flip-card-clicked');
        }
    }
});

function handleCardClick(card) {
    const now = Date.now();
    if (now - lastClickTime < clickDelay) return;
    lastClickTime = now;
    if (chosenCards.has(card)) {
        // Card is already chosen, so ignore this click
        return;
    }
    chosenCards.add(card);
    card.classList.add('flip-card-clicked');
    const cardIndex = currentCards.indexOf(card); // Get the index of the clicked card
    const cardData = {
        index: cardIndex, // Send the card index instead of the number
        isFlipped: card.classList.contains('flip-card-clicked')
    };
    socket.emit('cardClicked', cardData);

    // Allow clicks again if the cards are flipped back
    setTimeout(() => {
        chosenCards.delete(card);
    }, clickDelay);
}
