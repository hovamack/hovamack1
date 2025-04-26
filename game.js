// Connect to the server
const socket = io();

// Game elements
const penguin = document.getElementById('player');
const gameArea = document.querySelector('.game-world');
const chatBubble = document.getElementById('chat-bubble');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const colorMenu = document.getElementById('color-menu');
const closeMenuButton = document.getElementById('close-menu');
const colorOptions = document.querySelectorAll('.color-option');
const usernameScreen = document.getElementById('username-screen');
const usernameInput = document.getElementById('username-input');
const startButton = document.getElementById('start-button');
const usernameLabel = document.getElementById('username-label');

// Store other players
const otherPlayers = {};

// Username screen functionality
startButton.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) {
        usernameLabel.textContent = username;
        usernameScreen.style.display = 'none';
        gameArea.style.display = 'block';
        
        // Join the game
        socket.emit('player-join', username);
    } else {
        alert('Please enter a username!');
    }
});

// Allow Enter key to start
usernameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        startButton.click();
    }
});

// Set initial position
penguin.style.left = '50%';
penguin.style.top = '50%';

// Add click handler for movement
gameArea.addEventListener('click', (event) => {
    // Only move if clicking on the game area (not the penguin)
    if (event.target === gameArea) {
        const position = {
            x: event.clientX,
            y: event.clientY
        };
        movePenguin(position);
        socket.emit('player-move', position);
    }
});

// Add click handler for penguin to open color menu
penguin.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent movement when clicking penguin
    colorMenu.style.display = 'block';
});

// Close menu when clicking close button
closeMenuButton.addEventListener('click', () => {
    colorMenu.style.display = 'none';
});

// Handle color selection
colorOptions.forEach(option => {
    option.addEventListener('click', () => {
        const color = option.dataset.color;
        penguin.style.backgroundColor = color;
        
        // Update selected state
        colorOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
        // Notify other players
        socket.emit('player-color', color);
    });
});

function movePenguin(position) {
    penguin.style.left = position.x + 'px';
    penguin.style.top = position.y + 'px';
    penguin.style.transform = 'translate(-50%, -50%)';
}

// Create a new player element
function createPlayerElement(playerData) {
    const playerElement = document.createElement('div');
    playerElement.className = 'penguin other-player';
    playerElement.id = `player-${playerData.id}`;
    playerElement.style.backgroundColor = playerData.color;
    
    const usernameLabel = document.createElement('div');
    usernameLabel.className = 'username-label';
    usernameLabel.textContent = playerData.username;
    playerElement.appendChild(usernameLabel);
    
    const chatBubble = document.createElement('div');
    chatBubble.className = 'chat-bubble';
    playerElement.appendChild(chatBubble);
    
    gameArea.appendChild(playerElement);
    return playerElement;
}

// Update other player's position
function updatePlayerPosition(playerId, position) {
    const playerElement = document.getElementById(`player-${playerId}`);
    if (playerElement) {
        playerElement.style.left = position.x + 'px';
        playerElement.style.top = position.y + 'px';
        playerElement.style.transform = 'translate(-50%, -50%)';
    }
}

// Update other player's color
function updatePlayerColor(playerId, color) {
    const playerElement = document.getElementById(`player-${playerId}`);
    if (playerElement) {
        playerElement.style.backgroundColor = color;
    }
}

// Show message for other players
function showOtherPlayerMessage(playerId, message) {
    const playerElement = document.getElementById(`player-${playerId}`);
    if (playerElement) {
        const chatBubble = playerElement.querySelector('.chat-bubble');
        chatBubble.textContent = message;
        chatBubble.classList.add('show');
        
        setTimeout(() => {
            chatBubble.classList.remove('show');
        }, 3000);
    }
}

// Socket event handlers
socket.on('player-joined', (playerData) => {
    otherPlayers[playerData.id] = playerData;
    createPlayerElement(playerData);
});

socket.on('existing-players', (players) => {
    Object.entries(players).forEach(([id, playerData]) => {
        if (id !== socket.id) {
            otherPlayers[id] = playerData;
            createPlayerElement({ id, ...playerData });
        }
    });
});

socket.on('player-moved', (data) => {
    updatePlayerPosition(data.id, { x: data.x, y: data.y });
});

socket.on('player-color-changed', (data) => {
    updatePlayerColor(data.id, data.color);
});

socket.on('player-messaged', (data) => {
    showOtherPlayerMessage(data.id, data.message);
});

socket.on('player-left', (playerId) => {
    const playerElement = document.getElementById(`player-${playerId}`);
    if (playerElement) {
        playerElement.remove();
    }
    delete otherPlayers[playerId];
});

// Chat functionality
function showMessage(message) {
    chatBubble.textContent = message;
    chatBubble.classList.add('show');
    
    // Hide message after 3 seconds
    setTimeout(() => {
        chatBubble.classList.remove('show');
    }, 3000);
}

// Send message when button is clicked
sendButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) {
        showMessage(message);
        socket.emit('player-message', message);
        messageInput.value = '';
    }
});

// Send message when Enter key is pressed
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const message = messageInput.value.trim();
        if (message) {
            showMessage(message);
            socket.emit('player-message', message);
            messageInput.value = '';
        }
    }
}); 