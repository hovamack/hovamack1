const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Serve static files
app.use(express.static(path.join(__dirname, '/')));

// Store connected players
const players = {};

io.on('connection', (socket) => {
    console.log('A user connected');

    // When a new player joins
    socket.on('player-join', (username) => {
        players[socket.id] = {
            username,
            x: 50,
            y: 50,
            color: '#000000'
        };
        // Send the new player to all other players
        socket.broadcast.emit('player-joined', {
            id: socket.id,
            ...players[socket.id]
        });
        // Send all existing players to the new player
        socket.emit('existing-players', players);
    });

    // When a player moves
    socket.on('player-move', (position) => {
        if (players[socket.id]) {
            players[socket.id].x = position.x;
            players[socket.id].y = position.y;
            socket.broadcast.emit('player-moved', {
                id: socket.id,
                x: position.x,
                y: position.y
            });
        }
    });

    // When a player changes color
    socket.on('player-color', (color) => {
        if (players[socket.id]) {
            players[socket.id].color = color;
            socket.broadcast.emit('player-color-changed', {
                id: socket.id,
                color: color
            });
        }
    });

    // When a player sends a message
    socket.on('player-message', (message) => {
        if (players[socket.id]) {
            socket.broadcast.emit('player-messaged', {
                id: socket.id,
                username: players[socket.id].username,
                message: message
            });
        }
    });

    // When a player disconnects
    socket.on('disconnect', () => {
        if (players[socket.id]) {
            delete players[socket.id];
            socket.broadcast.emit('player-left', socket.id);
        }
    });
});

// Use the port that Heroku provides, or default to 3000 for local development
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 