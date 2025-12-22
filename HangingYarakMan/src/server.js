import { WebSocketServer } from "ws";
import getHangmanKeyword from "./kuhlschum.js";

const wss = new WebSocketServer({ port: 8080 });

const MAX_PLAYERS_PER_ROOM = 6;
const GUESS_COOLDOWN_MS = 500;
const MAX_ROOM_NAME_LENGTH = 50;
const MAX_PLAYER_NAME_LENGTH = 30;

const rooms = {};

function createRoom(room) {
    rooms[room] = {
        word: "",
        guessedLetters: [],
        wrongGuesses: 0,
        maxGuesses: 8,
        players: [],
        sockets: [],
        currentTurn: 0,
        lastGuessTime: 0,
        gameActive: true
    };
}

async function resetRoom(room) {
    const r = rooms[room];
    r.word = await getHangmanKeyword();
    r.guessedLetters = [];
    r.wrongGuesses = 0;
    r.currentTurn = 0;
    r.gameActive = true;
    r.lastGuessTime = 0;
}

function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().substring(0, 100).replace(/[<>]/g, '');
}

function validateRoomName(room) {
    if (typeof room !== 'string' || room.length === 0 || room.length > MAX_ROOM_NAME_LENGTH) {
        return false;
    }
    return /^[a-zA-Z0-9_-]+$/.test(room);
}

function validatePlayerName(name) {
    if (typeof name !== 'string' || name.length === 0 || name.length > MAX_PLAYER_NAME_LENGTH) {
        return false;
    }
    return /^[a-zA-Z0-9 _-]+$/.test(name);
}

function broadcast(room) {
    if (!rooms[room]) return;

    const r = rooms[room];
    const message = JSON.stringify({
        type: "state",
        payload: {
            word: r.word,
            guessedLetters: [...r.guessedLetters],
            wrongGuesses: r.wrongGuesses,
            maxGuesses: r.maxGuesses,
            players: [...r.players],
            currentTurn: r.currentTurn,
            gameActive: r.gameActive
        }
    });

    // Filter out closed connections before broadcasting
    r.sockets = r.sockets.filter(ws => {
        if (ws.readyState === ws.OPEN) {
            try {
                ws.send(message);
                return true;
            } catch (e) {
                console.error('Error sending message:', e);
                return false;
            }
        }
        return false; // Remove closed connections
    });
}

wss.on("connection", ws => {
    ws.room = null;
    ws.name = null;
    ws.joinedAt = Date.now();

    ws.on("message", async data => {
        try {
            if (Date.now() - (ws.lastMessageTime || 0) < 100) {
                return;
            }
            ws.lastMessageTime = Date.now();

            const msg = JSON.parse(data.toString());

            if (!msg || typeof msg !== 'object' || !msg.type) {
                return;
            }

            if (msg.type === "join") {
                const { room, name } = msg;

                if (!validateRoomName(room) || !validatePlayerName(name)) {
                    ws.send(JSON.stringify({
                        type: "error",
                        payload: "Invalid room name or player name"
                    }));
                    return;
                }

                if (rooms[room] && rooms[room].players.length >= MAX_PLAYERS_PER_ROOM) {
                    ws.send(JSON.stringify({
                        type: "error",
                        payload: "Room is full"
                    }));
                    return;
                }

                if (rooms[room] && rooms[room].players.includes(name)) {
                    ws.send(JSON.stringify({
                        type: "error",
                        payload: "Name already taken in this room"
                    }));
                    return;
                }

                if (!rooms[room]) {
                    createRoom(room);
                    await resetRoom(room);
                }

                const r = rooms[room];

                ws.room = room;
                ws.name = name;

                r.players.push(name);
                r.sockets.push(ws);

                ws.send(JSON.stringify({
                    type: "joined",
                    payload: { room, name }
                }));

                broadcast(room);
            }

            if (msg.type === "guess") {
                if (!ws.room || !rooms[ws.room]) {
                    ws.send(JSON.stringify({
                        type: "error",
                        payload: "Not in a valid room"
                    }));
                    return;
                }

                const r = rooms[ws.room];

                if (!r.gameActive) {
                    ws.send(JSON.stringify({
                        type: "error",
                        payload: "Game is not active"
                    }));
                    return;
                }

                const letter = msg.letter;

                if (typeof letter !== 'string' || letter.length !== 1 || !/^[a-zA-Z]$/.test(letter)) {
                    ws.send(JSON.stringify({
                        type: "error",
                        payload: "Invalid letter"
                    }));
                    return;
                }

                const playerIndex = r.players.indexOf(ws.name);

                if (playerIndex === -1) {
                    ws.send(JSON.stringify({
                        type: "error",
                        payload: "Player not found in room"
                    }));
                    return;
                }

                if (playerIndex !== r.currentTurn) {
                    ws.send(JSON.stringify({
                        type: "error",
                        payload: "Not your turn"
                    }));
                    return;
                }

                if (r.guessedLetters.includes(letter.toLowerCase())) {
                    ws.send(JSON.stringify({
                        type: "error",
                        payload: "Letter already guessed"
                    }));
                    return;
                }

                const now = Date.now();
                if (now - r.lastGuessTime < GUESS_COOLDOWN_MS) {
                    ws.send(JSON.stringify({
                        type: "error",
                        payload: "Too many guesses too fast"
                    }));
                    return;
                }
                r.lastGuessTime = now;

                r.guessedLetters.push(letter.toLowerCase());
                let correctGuess = r.word.toLowerCase().includes(letter.toLowerCase());

                if (!correctGuess) {
                    r.wrongGuesses++;

                    if (r.wrongGuesses >= r.maxGuesses) {
                        r.gameActive = false;
                    } else {
                        r.currentTurn = (r.currentTurn + 1) % r.players.length;
                    }
                }

                const wordComplete = r.word.split('').every(char =>
                    char === ' ' || r.guessedLetters.includes(char.toLowerCase())
                );

                if (wordComplete) {
                    r.gameActive = false;
                }

                broadcast(ws.room);
            }

            if (msg.type === "reset") {
                if (!ws.room || !rooms[ws.room]) {
                    ws.send(JSON.stringify({
                        type: "error",
                        payload: "Not in a valid room"
                    }));
                    return;
                }

                const r = rooms[ws.room];
                const playerIndex = r.players.indexOf(ws.name);

                if (playerIndex === -1) {
                    ws.send(JSON.stringify({
                        type: "error",
                        payload: "Player not found in room"
                    }));
                    return;
                }

                await resetRoom(ws.room);
                broadcast(ws.room);
            }
        } catch (e) {
            console.error('Error processing message:', e);
            try {
                ws.send(JSON.stringify({
                    type: "error",
                    payload: "Invalid message format"
                }));
            } catch (sendErr) {
            }
        }
    });

    ws.on("close", () => {
        const room = ws.room;
        if (!room || !rooms[room]) return;

        const r = rooms[room];
        const index = r.players.indexOf(ws.name);

        if (index !== -1) {
            r.players.splice(index, 1);
            r.sockets.splice(index, 1);

            if (r.players.length > 0) {
                if (r.currentTurn >= r.players.length) {
                    r.currentTurn = 0;
                } else if (index < r.currentTurn) {
                    r.currentTurn = Math.max(0, r.currentTurn - 1);
                }
            } else {
                delete rooms[room];
            }

            broadcast(room);
        }
    });

    ws.on("error", (error) => {
        console.error('WebSocket error:', error);
    });
});
