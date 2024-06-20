const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Generate random numbers and assign images
const gridSize = 4;
const gridSqNumber = gridSize * gridSize;
const currentArray = {};
const randomArray = generateRandomArray(gridSqNumber);

// Serve static files
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let chosenCards = new Map(); // Map to keep track of chosen cards

io.on('connection', (socket) => {
    console.log('A user connected');

    // Send the currentArray to the client
    socket.emit('currentArray', { currentArray, randomArray });

    socket.on('cardClicked', (cardData) => {
        const { index } = cardData;
        console.log(`Card at index ${index} flipped: ${cardData.isFlipped}`);
        socket.broadcast.emit('flipCard', { index, isFlipped: cardData.isFlipped });

        // Handle card selection logic
        handleCardSelection(socket, index);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        chosenCards.delete(socket.id);
    });
});

http.listen(3000, () => {
    console.log('Listening on *:3000');
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function chooseRandomImages(r) {
    const images = {
        1: 'images/img1.svg',
        2: 'images/img2.svg',
        3: 'images/img3.svg',
        4: 'images/img4.svg',
        5: 'images/img5.svg',
        6: 'images/img6.svg',
        7: 'images/img7.svg',
        8: 'images/img8.svg',
        9: 'images/img9.svg',
        10: 'images/img10.svg',
        11: 'images/img11.svg',
        12: 'images/img12.svg',
        13: 'images/img13.svg',
        14: 'images/img14.svg',
        15: 'images/img15.svg',
        16: 'images/img16.svg',
        17: 'images/img17.svg',
        18: 'images/img18.svg',
        19: 'images/img19.svg',
        20: 'images/img20.svg',
        21: 'images/img21.svg',
        22: 'images/img22.svg',
        23: 'images/img23.svg',
        24: 'images/img24.svg',
    };

    let values = Object.values(images);
    values = shuffleArray(values);
    const uniqueImages = values.slice(0, r);
    console.log(values);
    return uniqueImages;
}

function generateRandomArray(n) {
    const set = new Set();
    while (set.size < n / 2) {
        const randomNumber = Math.floor(Math.random() * 100);
        set.add(randomNumber);
    }
    const array = [...set, ...set];
    const chosenImages = chooseRandomImages(n / 2);
    Array.from(set).forEach((element, index) => currentArray[element] = chosenImages[index]);
    return shuffleArray(array);
}

function handleCardSelection(socket, index) {
    const cardValue = randomArray[index];

    if (!chosenCards.has(socket.id)) {
        chosenCards.set(socket.id, []);
    }

    const selectedCards = chosenCards.get(socket.id);
    selectedCards.push({ index, value: cardValue });

    if (selectedCards.length === 2) {
        const [firstCard, secondCard] = selectedCards;

        if (firstCard.value === secondCard.value) {
            // Cards match
            io.emit('flipCard', { index: firstCard.index, isFlipped: true });
            io.emit('flipCard', { index: secondCard.index, isFlipped: true });
        } else {
            // Cards do not match, flip them back after a delay
            setTimeout(() => {
                io.emit('flipCard', { index: firstCard.index, isFlipped: false });
                io.emit('flipCard', { index: secondCard.index, isFlipped: false });
            }, 1000);
        }

        chosenCards.set(socket.id, []); // Reset for the next selection
    }
}
